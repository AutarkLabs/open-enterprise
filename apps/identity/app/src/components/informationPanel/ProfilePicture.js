import React, { useCallback, useContext, Fragment } from 'react'
import PropTypes from 'prop-types'
import { useDropzone } from 'react-dropzone'
import styled from 'styled-components'
import { Buffer } from 'ipfs-http-client'

import { BoxContext } from '../../wrappers/box'
import infuraIpfs from '../../../ipfs'

import {
  uploadingImage,
  uploadedImage,
  uploadedImageFailure,
} from '../../stateManagers/box'

import addImage from '../../assets/image-add-button.svg'
import editImage from '../../assets/pencil-black-tool-interface-symbol.png'

const ProfilePicture = ({ ethereumAddress }) => {
  const { boxes, dispatch } = useContext(BoxContext)
  const onDrop = useCallback(
    acceptedFiles => {
      dispatch(uploadingImage(ethereumAddress))

      const reader = new FileReader()

      reader.onerror = error => {
        reader.onabort = () =>
          console.log('file reading failed and was aborted')
        dispatch(uploadedImageFailure(error))
      }

      reader.onload = async () => {
        try {
          const file = Buffer.from(reader.result)
          const result = await infuraIpfs.add(file)
          dispatch(uploadedImage(ethereumAddress, result[0].hash))
        } catch (error) {
          dispatch(uploadedImageFailure(error))
        }
      }

      acceptedFiles.forEach(file => reader.readAsArrayBuffer(file))
    },
    [dispatch, ethereumAddress]
  )
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({ accept: 'image/*', onDrop })

  const userLoaded = !!boxes[ethereumAddress]
  const isEditing = userLoaded ? boxes[ethereumAddress].editingProfile : false

  const hasImage =
    userLoaded &&
    boxes[ethereumAddress].publicProfile.image &&
    boxes[ethereumAddress].publicProfile.image.length > 0

  const publicProfileImageCid =
    hasImage && boxes[ethereumAddress].publicProfile.image[0].contentUrl['/']

  const addedImage = userLoaded && boxes[ethereumAddress].uploadedImageSuccess

  const editProfileImageCid = addedImage
    ? boxes[ethereumAddress].forms.image[0].contentUrl['/']
    : publicProfileImageCid

  return (
    <Fragment>
      <Container
        {...getRootProps({
          className: 'dropzone',
          isDragActive,
          isDragAccept,
          isDragReject,
          isEditing,
          publicProfileImageCid,
          editProfileImageCid,
        })}
      >
        {isEditing && (
          <TransparentEditOverlay>
            <EditIcon />
          </TransparentEditOverlay>
        )}
        <input {...getInputProps({ disabled: !isEditing })} />
      </Container>
    </Fragment>
  )
}

ProfilePicture.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

const getBorderColor = props => {
  if (props.isEditing) {
    if (props.isDragAccept) return '#00e676'
    if (props.isDragReject) return '#ff1744'
    if (props.isDragActive) return '#2196f3'
  }
  if (props.imageCid) return 'white'
  return 'black'
}

const getBackground = props => {
  const imageCid = props.isEditing
    ? props.editProfileImageCid
    : props.publicProfileImageCid

  if (imageCid) return `url(https://ipfs.infura.io/ipfs/${imageCid})`

  return `url(${addImage})`
}

const getBorderStyle = props => {
  if (props.isEditing) return 'dashed'
  return 'solid'
}

const Container = styled.div`
  cursor: ${props => props.isEditing && 'pointer'};
  padding: 20px;
  border-width: 2px;
  border-color: ${props => getBorderColor(props)};
  border-style: ${props => getBorderStyle(props)};
  background-image: ${props => getBackground(props)};
  background-size: 150px 150px;
  transition: border 0.24s ease-in-out;
  border-radius: 50%;
  width: 150px;
  height: 150px;
  position: relative;
  top: 30px;
`

const TransparentEditOverlay = styled.div`
  width: 146px;
  height: 146px;
  cursor: pointer;
  background-color: white;
  position: absolute;
  opacity: 0.5;
  top: 0px;
  left: 0px;
  border-radius: 50%;
`

const EditIcon = styled.img.attrs({ src: editImage })`
  width: 25px;
  position: absolute;
  right: 15px;
  top: 5px;
`

export default ProfilePicture
