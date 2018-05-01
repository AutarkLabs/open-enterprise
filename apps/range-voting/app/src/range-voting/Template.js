import React from 'react'
import styled from 'styled-components'
import { noop } from '../utils/utils'
import { lerp } from '../utils/math-utils'
import TemplateCard from '../components/TemplateCard'
import { Main, Content, Title, Subtitle } from '../style'

class Template extends React.Component {
  static defaultProps = {
    warm: false,
    positionProgress: 0,
    onSelect: noop,
  }
  handleTemplateSelect = template => {
    this.props.onSelect(template)
  }
  render() {
    const { positionProgress, warm, templates, activeTemplate } = this.props
    return (
      <Main>
        <Content
          style={{
            transform: `translateX(${lerp(positionProgress, 0, 50)}%)`,
            opacity: 1 - Math.abs(positionProgress),
            willChange: warm ? 'opacity, transform' : 'auto',
          }}
        >
          <TemplateContent
            templates={templates}
            activeTemplate={activeTemplate}
            handleTemplateSelect={this.handleTemplateSelect}
          />
        </Content>
      </Main>
    )
  }
}

class TemplateContent extends React.PureComponent {
  render() {
    return (
      <React.Fragment>
        <Title>
            Create multi-option vote
        </Title>

          <Subtitle>
            A way to gather votes and opinions on questions that have multiple options.
            Choose a template to get started quickly. Don't worry - you can change it later.
          </Subtitle>
        <Templates>
          {[...this.props.templates.entries()].map(
            ([template, { label, icon, description }], i) => (
              <TemplateCardWrapper key={i}>
                <TemplateCard
                  template={template}
                  icon={icon}
                  label={label}
                  description={description}
                  active={template === this.props.activeTemplate}
                  onSelect={this.props.handleTemplateSelect}
                />
              </TemplateCardWrapper>
            )
          )}
        </Templates>
      </React.Fragment>
    )
  }
}

const Templates = styled.div`
  display: flex;
  margin-top: 50px;
`

const TemplateCardWrapper = styled.div`
  & + & {
    margin-left: 25px;
  }
`

export default Template
