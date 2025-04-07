import nibabel as nib
import numpy as np
from nilearn import datasets, image


def get_slices(fmri_data, slice_index):
    brain_img = nib.load(fmri_data)
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
    axial_slice = brain_data[:, :, slice_index]
    coronal_slice = brain_data[:, slice_index, :]
    sagittal_slice = brain_data[slice_index, :, :]
    axial_atlas = atlas_data[:, :, slice_index]
    coronal_atlas = atlas_data[:, slice_index, :]
    sagittal_atlas = atlas_data[slice_index, :, :]
    print(type(axial_slice))
    print(type(axial_atlas))
    print(type(brain_data))
    max_slice_index = brain_data.shape[2] - 1  # Use axial depth

    return ({
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
    })


# if __name__ == "__main__":
