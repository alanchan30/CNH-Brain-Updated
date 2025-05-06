import nibabel as nib
import numpy as np
from nilearn import datasets, image
import os


def get_slices(fmri_path: str, slice_index: int, atlas_name: str = "Harvard-Oxford"):
    """
    Load an fMRI NIfTI file, resample the chosen atlas to its space, and extract 2D slices.

    Parameters:
    - fmri_path: path to the NIfTI file on disk
    - slice_index: index of the axial slice to extract
    - atlas_name: one of 'Harvard-Oxford', 'Craddock2012', or 'Destrieux'

    Returns a dict with:
    - brain: dict of 2D brain data arrays (axial, coronal, sagittal)
    - atlas: dict of 2D atlas label arrays (axial, coronal, sagittal)
    - labels: list of atlas region names
    - max_index: maximum valid slice index (axial depth - 1)
    """
    try:
        # Check file exists
        if not os.path.exists(fmri_path):
            raise FileNotFoundError(f"File not found: {fmri_path}")

        # Load NIfTI image
        brain_img = nib.load(fmri_path)
        if not isinstance(brain_img, nib.Nifti1Image):
            raise ValueError("File is not a valid NIfTI image")

        # Select atlas based on user choice
        if atlas_name == "Craddock2012":
            atl = datasets.fetch_atlas_craddock_2012()
            maps_img = atl.scorr_mean
            labels = atl.labels
        elif atlas_name == "Destrieux":
            atl = datasets.fetch_atlas_destrieux_2009()
            maps_img = atl.maps
            labels = atl.labels
        else:
            atl = datasets.fetch_atlas_harvard_oxford(
                'cort-maxprob-thr50-1mm', symmetric_split=True
            )
            maps_img = atl.maps
            labels = atl.labels

        # Resample atlas to match the fMRI image space
        resampled_atlas = image.resample_to_img(
            maps_img,
            brain_img,
            interpolation='nearest',
            copy_header=True
        )

        # Convert to numpy arrays
        brain_data = brain_img.get_fdata()
        atlas_data = resampled_atlas.get_fdata().astype(int)

        # Validate slice index
        if slice_index < 0 or slice_index >= brain_data.shape[2]:
            raise ValueError(
                f"Slice index must be between 0 and {brain_data.shape[2] - 1}, got {slice_index}"
            )

        # Extract 2D slices
        axial_slice    = brain_data[:, :, slice_index]
        coronal_slice  = brain_data[:, slice_index, :]
        sagittal_slice = brain_data[slice_index, :, :]

        axial_atlas    = atlas_data[:, :, slice_index]
        coronal_atlas  = atlas_data[:, slice_index, :]
        sagittal_atlas = atlas_data[slice_index, :, :]

        max_index = brain_data.shape[2] - 1

        return {
            "brain": {
                "axial":    axial_slice.tolist(),
                "coronal":  coronal_slice.tolist(),
                "sagittal": sagittal_slice.tolist(),
            },
            "atlas": {
                "axial":    axial_atlas.tolist(),
                "coronal":  coronal_atlas.tolist(),
                "sagittal": sagittal_atlas.tolist(),
            },
            "labels":    labels,
            "max_index": max_index
        }

    except Exception as e:
        raise ValueError(f"Error processing fMRI data: {str(e)}")
