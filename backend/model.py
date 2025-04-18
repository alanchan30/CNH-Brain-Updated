import joblib
from nilearn.input_data import NiftiLabelsMasker
import nibabel as nib
from io import BytesIO

def predict_from_nifti(file_bytes: bytes):
    fmri = nib.load(BytesIO(file_bytes))

    masker = NiftiLabelsMasker(
        labels_img=atlas_filename,
        standardize=True,
        memory='nilearn_cache',
        verbose=1
    )

    time_series = masker.fit_transform(fmri)
    