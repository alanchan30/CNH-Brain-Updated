import joblib
import numpy as np
from nilearn.input_data import NiftiLabelsMasker
from nilearn.connectome import ConnectivityMeasure
import nibabel as nib
from nibabel import FileHolder, Nifti1Image
import os
from io import BytesIO
import tempfile
import pathlib as Path
import gzip
import logging

def predict_from_nifti(file_content: bytes, original_filename: str):
    """
    Predict brain condition from a NIFTI file
    
    Parameters:
    -----------
    file_content : bytes
        The binary content of the NIFTI file
    original_filename : str
        The original filename of the uploaded file
        
    Returns:
    --------
    int
        The model prediction (0 or 1)
    """
    print(f"[MODEL] Starting prediction for file: {original_filename}")
    print(f"[MODEL] File content size: {len(file_content)/1024/1024:.2f}MB")
    
    # Determine suffix from original filename
    _, ext = os.path.splitext(original_filename)
    suffix = ext if ext in ['.nii', '.gz', '.nii.gz'] else '.nii'

    # Handle double extensions like .nii.gz
    if original_filename.endswith(".nii.gz"):
        suffix = ".nii.gz"
    
    print(f"[MODEL] Using file suffix: {suffix}")

    # Create a temporary file to process
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_content)
            temp_file_path = tmp.name
            print(f"[MODEL] Temporary file created at: {temp_file_path}")

        # Load the NIFTI file
        print(f"[MODEL] Loading NIFTI file")
        fmri = nib.load(temp_file_path)
        print(f"[MODEL] NIFTI file loaded successfully, shape: {fmri.shape}")

        # Load the atlas
        atlas_path = os.path.join("template_cambridge_basc_multiscale_sym_scale064.nii.gz")
        print(f"[MODEL] Loading atlas from: {atlas_path}")
        atlas_filename = nib.load(atlas_path)
        print(f"[MODEL] Atlas loaded successfully")

        # Create masker
        print(f"[MODEL] Creating NiftiLabelsMasker")
        masker = NiftiLabelsMasker(
            labels_img=atlas_filename,
            standardize=True,
            memory='nilearn_cache',
            verbose=0  # Reduce verbosity
        )

        # Extract time series
        print(f"[MODEL] Extracting time series")
        time_series = masker.fit_transform(fmri)
        print(f"[MODEL] Time series extracted, shape: {time_series.shape}")
        
        # Check for NaNs in time series
        if np.isnan(time_series).any():
            print(f"[MODEL] Warning: NaNs detected in time series. Replacing with zeros.")
            time_series = np.nan_to_num(time_series, nan=0.0)

        # Compute correlation matrix
        print(f"[MODEL] Computing correlation matrix")
        correlation_measure = ConnectivityMeasure(kind='correlation')
        correlation_matrix = correlation_measure.fit_transform([time_series])[0]
        print(f"[MODEL] Correlation matrix computed, shape: {correlation_matrix.shape}")
        
        # Ensure symmetry
        correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
        
        # Check for NaNs or infinities in correlation matrix
        if np.isnan(correlation_matrix).any() or np.isinf(correlation_matrix).any():
            print(f"[MODEL] Warning: NaNs or infinities detected in correlation matrix. Replacing with zeros.")
            correlation_matrix = np.nan_to_num(correlation_matrix, nan=0.0, posinf=0.0, neginf=0.0)

        # Extract lower triangle excluding diagonal and reshape
        print(f"[MODEL] Extracting features from correlation matrix")
        lower_triangular = correlation_matrix[np.tril_indices(64, k=-1)]
        reshaped_features = lower_triangular.reshape(1, -1)
        print(f"[MODEL] Features extracted, shape: {reshaped_features.shape}")
        
        # Ensure no NaNs or infinities in features
        reshaped_features = np.nan_to_num(reshaped_features, nan=0.0, posinf=0.0, neginf=0.0)

        # Load and run the model
        model_path = os.path.join("svm_model.pkl")
        print(f"[MODEL] Loading SVM model from: {model_path}")
        svm_model = joblib.load(model_path)
        print(f"[MODEL] Model loaded successfully")

        # Make prediction
        print(f"[MODEL] Running prediction")
        model_result = svm_model.predict(reshaped_features)
        print(f"[MODEL] Prediction complete: {model_result[0]}")
        
        return int(model_result[0])
    
    except Exception as e:
        print(f"[MODEL] Error during prediction: {str(e)}")
        import traceback
        print(f"[MODEL] Error traceback: {traceback.format_exc()}")
        raise e
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print(f"[MODEL] Temporary file deleted: {temp_file_path}")
            except Exception as cleanup_error:
                print(f"[MODEL] Failed to delete temporary file: {cleanup_error}")
