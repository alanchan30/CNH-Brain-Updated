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

def predict_from_nifti(file_content: bytes):
    with gzip.GzipFile(fileobj=BytesIO(file_content)) as gz:
        uncompressed_nifti_bytes = gz.read()
    
    file_like = BytesIO(uncompressed_nifti_bytes)

    fmri = nib.Nifti1Image.from_file_map({
        'header': nib.FileHolder(fileobj=file_like),
        'image': nib.FileHolder(fileobj=file_like)
    })

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
    print(type (time_series))
    correlation_matrix = correlation_measure.fit_transform([time_series])[0]
    
    correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2  # Ensure symmetry

    # Extract lower triangle excluding diagonal and reshape to (1, 2016)
    lower_triangular = correlation_matrix[np.tril_indices(64, k=-1)]
    reshaped_features = lower_triangular.reshape(1, -1)
    print("HAHAHAHAHA", reshaped_features)
    model_path = os.path.join("svm_model.pkl")
    print(type(model_path))
    svm_model = joblib.load(model_path)
    print(type(reshaped_features))
    model_result = svm_model.predict(reshaped_features)
    print(type(model_result))
    return model_result
