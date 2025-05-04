import torch
import numpy as np
from nilearn.input_data import NiftiLabelsMasker
from nilearn.connectome import ConnectivityMeasure
import nibabel as nib
from nibabel import FileHolder, Nifti1Image
from torch_geometric.data import Data
from sklearn.metrics.pairwise import cosine_similarity
from GNN import SpectralGCN
import os
from io import BytesIO
import tempfile
import pathlib as Path
import gzip

def predict_from_nifti(file_content: bytes, original_filename: str):
    print("File content", type(file_content))
    
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

    atlas_path = os.path.join("template_cambridge_basc_multiscale_sym_scale064.nii.gz")
    atlas_filename = nib.load(atlas_path)

    masker = NiftiLabelsMasker(
        labels_img=atlas_filename,
        standardize=True,
        memory='nilearn_cache',
        verbose=1
    )

    time_series = masker.fit_transform(fmri)
    
    if np.isnan(time_series).all():
        os.remove(tmp_path)
        raise ValueError("The time series contains only NaN values.")
    
    correlation_measure = ConnectivityMeasure(kind='correlation', vectorize=True, discard_diagonal=True)
    correlation_matrix = correlation_measure.fit_transform([time_series])[0]
    correlation_matrix = correlation_matrix.reshape(1, -1)
    
    if np.isnan(correlation_matrix).all():
        os.remove(tmp_path)
        raise ValueError("The correlation matrix contains only NaN values.")

    
    features = torch.tensor(correlation_matrix).float()
    
    if torch.isnan(features).all():
        os.remove(tmp_path)
        raise ValueError("The feature tensor contains only NaN values.")

    N = features.size(0)
    sim_matrix = cosine_similarity(features)
    np.fill_diagonal(sim_matrix, 0)
    edge_index = []
    for i in range(N):
        for j in np.argsort(-sim_matrix[i])[:5]:
            edge_index.append([i, j])
    edge_index = torch.tensor(edge_index).t().contiguous()

    data = Data(x=features, edge_index=edge_index)

    model = SpectralGCN(in_channels=2016, hidden_channels=128, out_channels=1, K=3)
    model_path = os.path.join("gnn_model_weights.pt")

    model.load_state_dict(torch.load(model_path))
    model.eval()
    
    # Perform inference with the GNN model
    with torch.no_grad():
        output = model(data)
    
    probability = torch.sigmoid(output)

    prediction = (probability > 0.5).int().item()
    print(f"Prediction: {prediction}")
    os.remove(tmp_path)
    
    return prediction
