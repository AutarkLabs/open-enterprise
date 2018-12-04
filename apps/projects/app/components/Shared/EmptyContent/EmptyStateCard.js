import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, Text, theme } from '@aragon/ui'

// TODO: Temp workaround until https://github.com/aragon/aragon-ui/issues/196 is solved

const StyledCard = styled.div`
  width: ${({ width }) => width || '282px'};
  height: ${({ height }) => height || '322px'};
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  display: flex;
  padding: 35px;
  align-items: center;
  text-align: center;
  section {
    padding-top: 20px;
  }
`

const StyledHeading = styled.h1`
  margin: 20px 0 5px;
`

const StyledActionButton = styled(Button)`
  width: 150px;
  margin-top: 20px;
`

// TODO: Reduce code complexity here
const EmptyStateCard = ({
  actionText,
  onActivate,
  text,
  title,
  actionButton: ActionButton,
  icon: Icon,
  ...props
}) => (
  <StyledCard {...props}>
    <section>
      <Icon />
      <StyledHeading>
        <Text color={theme.accent} weight="bold" size="large">
          {title}
        </Text>
      </StyledHeading>
      <Text.Block>{text}</Text.Block>
      <ActionButton mode="strong" onClick={onActivate}>
        {actionText}
      </ActionButton>
    </section>
  </StyledCard>
)

EmptyStateCard.propTypes = {
  actionButton: PropTypes.func,
  actionText: PropTypes.string,
  icon: PropTypes.func,
  onActivate: PropTypes.func,
  text: PropTypes.string,
  title: PropTypes.string,
}

EmptyStateCard.defaultProps = {
  actionButton: StyledActionButton,
  title: 'Nothing here.',
}

export default EmptyStateCard
