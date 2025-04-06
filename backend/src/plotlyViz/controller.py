import nibabel as nib
import numpy as np
from nilearn import datasets, image



def get_slices(fmri_data):
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
    mid_axial = brain_data[:, :, brain_data.shape[2] // 2].T.tolist()
    mid_coronal = brain_data[:, brain_data.shape[1] // 2, :].T.tolist()
    mid_sagittal = np.flipud(brain_data[brain_data.shape[0] // 2, :, :].T).tolist()
    atlas_slice = atlas_data[:, :, brain_data.shape[2] // 2].T.astype(int).tolist()

    return ({
        "brain": {
            "axial": mid_axial,
            "coronal": mid_coronal,
            "sagittal": mid_sagittal,
        },
        "atlas": atlas_slice,
        "labels": labels
    })


# if __name__ == "__main__":
    


    