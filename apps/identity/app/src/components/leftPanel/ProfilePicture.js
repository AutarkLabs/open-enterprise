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
          const arrayBuffer = reader.result
          const file = Buffer.from(arrayBuffer)
          const result = await infuraIpfs.add(file)
          dispatch(uploadedImage(ethereumAddress, result[0].hash))
        } catch (error) {
          dispatch(uploadedImageFailure(error))
        }
      }

      acceptedFiles.forEach(file => {
        reader.readAsArrayBuffer(file)
      })
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

  const imageCid =
    hasImage && boxes[ethereumAddress].forms.image[0].contentUrl['/']

  return (
    <Fragment>
      <Container
        {...getRootProps({
          className: 'dropzone',
          isDragActive,
          isDragAccept,
          isDragReject,
          isEditing,
          imageCid,
        })}
      >
        <input {...getInputProps({ disabled: !isEditing })} />
      </Container>
    </Fragment>
  )
}

ProfilePicture.propTypes = {
  ethereumAddress: PropTypes.string.isRequired,
}

export default ProfilePicture

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
  if (props.imageCid)
    return `url(https://ipfs.infura.io/ipfs/${props.imageCid})`

  return `url(${addImage})`
}

const getBorderStyle = props => {
  if (props.isEditing) return 'dashed'
  return 'solid'
}

const Container = styled.div`
  cursor: ${props => props.isEditing && 'pointer'};
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${props => getBorderColor(props)};
  border-style: ${props => getBorderStyle(props)};
  background: ${props => getBackground(props)};
  background-size: 150px 150px;
  color: #bdbdbd;
  outline: none;
  transition: border 0.24s ease-in-out;
  border-radius: 50%;
  width: 150px;
  height: 150px;
  position: relative;
  top: 30px;
`

const EditIcon = styled.img`
  width: 25px;
  position: absolute;
  right: 15px;
  top: 5px;
`
