import nibabel as nib
import numpy as np
from nilearn import datasets, image
import os


def get_slices(fmri_data, slice_index):
    try:
        # Check if file exists
        if not os.path.exists(fmri_data):
            raise FileNotFoundError(f"File not found: {fmri_data}")

        # Try to load the NIfTI file
        try:
            brain_img = nib.load(fmri_data)
        except nib.filebasedimages.ImageFileError as e:
            raise ValueError(f"Invalid NIfTI file format: {str(e)}")

        # Verify it's a valid NIfTI file
        if not isinstance(brain_img, nib.Nifti1Image):
            raise ValueError("File is not a valid NIfTI image")

        # Load MNI template and atlas
        mni_ref = datasets.load_mni152_template(resolution=1)
        atlas = datasets.fetch_atlas_harvard_oxford(
            'cort-maxprob-thr50-1mm', symmetric_split=True)
        atlas_img = atlas.maps
        labels = atlas.labels

        # Resample atlas to match brain
        resampled_atlas = image.resample_to_img(
            atlas_img, brain_img, interpolation='nearest')

        # Convert to arrays
        brain_data = brain_img.get_fdata()
        atlas_data = resampled_atlas.get_fdata().astype(int)

        # Validate slice index
        if slice_index < 0 or slice_index >= brain_data.shape[2]:
            raise ValueError(
                f"Invalid slice index: {slice_index}. Must be between 0 and {brain_data.shape[2] - 1}")

        # Extract slices
        axial_slice = brain_data[:, :, slice_index]
        coronal_slice = brain_data[:, slice_index, :]
        sagittal_slice = brain_data[slice_index, :, :]
        axial_atlas = atlas_data[:, :, slice_index]
        coronal_atlas = atlas_data[:, slice_index, :]
        sagittal_atlas = atlas_data[slice_index, :, :]

        max_slice_index = brain_data.shape[2] - 1  # Use axial depth

        return {
            "brain": {
                "axial": axial_slice.tolist(),
                "coronal": coronal_slice.tolist(),
                "sagittal": sagittal_slice.tolist(),
            },
            "atlas": {
                "axial": axial_atlas.tolist(),
                "coronal": coronal_atlas.tolist(),
                "sagittal": sagittal_atlas.tolist(),
            },
            "labels": labels,
            "max_index": max_slice_index
        }
    except Exception as e:
        raise ValueError(f"Error processing fMRI data: {str(e)}")


# if __name__ == "__main__":
