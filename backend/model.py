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

def predict_from_nifti(file_content: bytes, original_filename: str):
    print("FIle content", type(file_content))
    
    # Determine suffix from original filename
    _, ext = os.path.splitext(original_filename)
    suffix = ext if ext in ['.nii', '.gz', '.nii.gz'] else '.nii'

    # Handle double extensions like .nii.gz
    if original_filename.endswith(".nii.gz"):
        suffix = ".nii.gz"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        fmri = nib.load(tmp_path)
    except Exception as e:
        os.remove(tmp_path)
        raise ValueError(f"Unable to load file as NIFTI or NIFTI.gz: {str(e)}")

    # fmri = nib.Nifti1Image.from_file_map({
    #     'header': nib.FileHolder(fileobj=file_like),
    #     'image': nib.FileHolder(fileobj=file_like)
    # })

    # with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.gz") as temp_file:
    #     temp_file.write(file_content)
    #     temp_file_path = temp_file.name
    # fmri = nib.load(temp_file_path)

    atlas_path = os.path.join("template_cambridge_basc_multiscale_sym_scale064.nii.gz")
    atlas_filename = nib.load(atlas_path)

    masker = NiftiLabelsMasker(
        labels_img=atlas_filename,
        standardize=True,
        memory='nilearn_cache',
        verbose=1
    )

    time_series = masker.fit_transform(fmri)
    correlation_measure = ConnectivityMeasure(kind='correlation')
    correlation_matrix = correlation_measure.fit_transform([time_series])[0]
    
    correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2  # Ensure symmetry

    # Extract lower triangle excluding diagonal and reshape to (1, 2016)
    lower_triangular = correlation_matrix[np.tril_indices(64, k=-1)]
    reshaped_features = lower_triangular.reshape(1, -1)
    
    # Replace NaNs with 0s
    reshaped_features = np.nan_to_num(reshaped_features, nan=0.0, posinf=0.0, neginf=0.0)

    model_path = os.path.join("svm_model.pkl")

    svm_model = joblib.load(model_path)

    model_result = svm_model.predict(reshaped_features)
    
    os.remove(tmp_path)
    
    return int(model_result[0])
