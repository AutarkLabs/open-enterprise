import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, Modal } from '@aragon/ui'

const Deactivate = ({ visible, budgetId, onClose, onSubmit }) => {
  const deactivate = () => {
    onSubmit(budgetId)
  }
  return (
    <Modal visible={visible} onClose={onClose}>
      <ModalTitle>
        Deactivate budget
      </ModalTitle>
      <ModalText>
        Deactivating this budget will immediately disable it once the decision is enacted. You may choose to reactivate this budget at any time.
      </ModalText>
      <ModalButtons>
        <Button
          label="Cancel"
          css={{ marginRight: '8px' }}
          onClick={onClose}
        />
        <Button
          label="Deactivate"
          mode="negative"
          onClick={deactivate}
        />
      </ModalButtons>
    </Modal>
  )
}

Deactivate.propTypes = {
  visible: PropTypes.bool.isRequired,
  budgetId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

const ModalTitle = styled.div`
  font-size: 26px;
`

const ModalText = styled.div`
  margin-top: 32px;
`

const ModalButtons = styled.div`
  margin-top: 48px;
  display: flex;
  justify-content: flex-end;
`

export default Deactivate
