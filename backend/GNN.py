from nilearn import datasets
from nilearn.input_data import NiftiLabelsMasker
from nilearn.connectome import ConnectivityMeasure
import torch.nn.functional as F
from torch_geometric.nn import ChebConv
import torch

# Define your model
class SpectralGCN(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels=128, out_channels=1, K=3, dropout=0.3):
        super().__init__()
        self.conv1 = ChebConv(in_channels, hidden_channels, K)
        self.conv2 = ChebConv(hidden_channels, out_channels, K)
        self.dropout = dropout

    def forward(self, data):
        x = F.relu(self.conv1(data.x, data.edge_index))
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv2(x, data.edge_index)
        return x.view(-1)