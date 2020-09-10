import React, { useCallback, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';
import styled from 'styled-components';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Delete';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import useTheme from '@material-ui/core/styles/useTheme';

interface Props {
  open: boolean;
  onClose(): void;
}

interface UploadedImage {
  blob: Blob;
  url: string;
}

interface Dimensions {
  width: number;
  height: number;
}

const Root = styled.div`
  .dropzone {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    &.empty {
      background-color: #eee;
      border: 2px dashed #000;
    }

    .uploadedImage {
      max-width: 100%;
      max-height: 100%;
    }

    .uploadFileInput {
      display: none;
    }

    .deleteIcon {
      position: absolute;
      top: 5px;
      right: 5px;
      border: 1px solid;
      background-color: #fff;
    }
  }

  .sizeControl {
    margin-top: 20px;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 800px;

    .dropzone {
      height: 450px;
    }
  }
`;

const CreatePuzzleDialog: React.FC<Props> = (props) => {
  const {
    open,
    onClose,
  } = props;
  const theme = useTheme();
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [selectedDimensionsIndex, setSelectedDimensionsIndex] = useState(-1);
  const [possibleDimensions, setPossibleDimensions] = useState<Dimensions[]>([]);
  const uploadFileInput = useRef<HTMLInputElement | null>(null);

  const allowedToCreate = !!uploadedImage && selectedDimensionsIndex !== -1;

  const createPuzzle = useCallback(() => {

  }, []);

  const selectFile = useCallback(() => {
    uploadFileInput.current?.click();
  }, []);

  const loadImage = useCallback((imageFile: File) => {
    const image = new Image();
    const url = URL.createObjectURL(imageFile);

    image.addEventListener('load', () => {
      console.log(image.width, image.height);

      batchedUpdates(() => {
        setUploadedImage({
          blob: imageFile,
          url,
        });
        setSelectedDimensionsIndex(0);
        setPossibleDimensions([
          { width: 4, height: 4 },
          { width: 10, height: 10 },
          { width: 15, height: 15 },
          { width: 20, height: 20 },
          { width: 30, height: 30 },
          { width: 50, height: 50 },
        ]);
      });
    });

    image.src = url;
  }, []);

  const selectDimensions = useCallback((e: React.ChangeEvent<{ value: unknown; }>) => {
    if (typeof e.target.value === 'number') {
      setSelectedDimensionsIndex(e.target.value);
    }
  }, []);

  const removeUploadedImage = useCallback(() => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.url);
    }

    if (uploadFileInput.current) {
      uploadFileInput.current.value = '';
    }

    setUploadedImage(null);
  }, [uploadedImage]);

  const onImageLoad = useCallback(() => {
    const input = uploadFileInput.current;

    if (!input) {
      return;
    }

    const image = input.files?.[0];

    if (image) {
      loadImage(image);
    }
  }, [loadImage]);

  const onImageOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    let image: File | null = null;

    for (const file of e.dataTransfer.files) {
      if (file.type.startsWith('image/')) {
        image = file;

        break;
      }
    }

    if (image) {
      loadImage(image);
    }
  }, [loadImage]);

  useEffect(() => {
    if (open) {
      setUploadedImage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.url);
      }
    }
  }, [open, uploadedImage]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle>
        Create Puzzle
      </DialogTitle>

      <DialogContent>
        <Root>
          <div
            className={classNames('dropzone', uploadedImage ? 'withImage' : 'empty')}
            style={{
              backgroundColor: uploadedImage ? undefined : theme.palette.primary.light,
            }}
            onClick={uploadedImage ? undefined : selectFile}
            onDragOver={uploadedImage ? undefined : onImageOver}
            onDrop={uploadedImage ? undefined : onImageDrop}
          >
            {uploadedImage ? (
              <>
                <img
                  className="uploadedImage"
                  src={uploadedImage.url}
                  alt="Uploaded Image"
                />

                <IconButton
                  className="deleteIcon"
                  color="primary"
                  onClick={removeUploadedImage}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            ) : (
              <Typography variant="h4" style={{ color: theme.palette.primary.contrastText }}>
                Select or Drop Image
              </Typography>
            )}

            <input
              className="uploadFileInput"
              type="file"
              accept="image/*"
              ref={uploadFileInput}
              onChange={onImageLoad}
            />
          </div>

          {uploadedImage && (
            <FormControl className="sizeControl">
              <InputLabel htmlFor="size">
                Size
              </InputLabel>

              <Select
                id="size"
                value={selectedDimensionsIndex}
                onChange={selectDimensions}
              >
                {possibleDimensions.map((dimensions, index) => (
                  <MenuItem key={index} value={index}>
                    {dimensions.width * dimensions.height} pieces ({dimensions.width}x{dimensions.height})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Root>
      </DialogContent>

      <DialogActions>
        <Button disabled={!allowedToCreate} color="secondary" onClick={createPuzzle}>
          Create
        </Button>

        <Button color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(CreatePuzzleDialog);
