# Flood Inundation Dataset (Sen1Floods11)

This directory is designated for raw and preprocessed Sentinel-1 SAR satellite imagery chips from the **Sen1Floods11 (India subset)** dataset.

### Dataset Overview
- **Sensor**: Sentinel-1 Synthetic Aperture Radar (SAR) C-band backscatter (VV and VH polarizations).
- **Resolution**: 10-meter ground resolution chips (512x512 pixels).
- **Labels**: Water / Non-water ground truth masks derived from permanent water baselines and thresholded Otsu masks.
- **Reference Publication**: Bonafilia et al., "Sen1Floods11: A Georeferenced Dataset to Train and Test Deep Learning Flood Algorithms for Sentinel-1".

### Acquisition & Setup
To download and prepare the dataset for training:
1. Download the Sen1Floods11 dataset from the official Cloud-to-Street repository or Radiant Earth MLHub.
2. Place the chips under `dataset/dataset/sen1floods11_india/` or configure the root path in `backend/config.py`.
3. Train the segmentation pipeline using `flood/training/train.py`.

