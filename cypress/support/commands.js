// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('getSiblings', { prevSubject: 'element' }, $element => {
  const siblings = []
  console.log('sibil', $element)

  const sibling = $element.nextSibling
  for (; sibling; sibling = sibling.nextSibling) {
    if (sibling.nodeType !== 1 || sibling === elem) continue
    siblings.push(sibling)
  }
  return siblings
})

Cypress.Commands.add('getButton', text => {
  return cy.getIframeElement('button').contains(text)
})

Cypress.Commands.add('getInput', text => {
  return cy.getIframeElement('input', `[name="${text}"]`)
})

Cypress.Commands.add('getIframeElement', element => {
  debugger
  return cy
    .get('iframe')
    .iframe()
    .get(element)
})

Cypress.Commands.add('iframe', { prevSubject: 'element' }, $iframe => {
  Cypress.log({
    name: 'iframe',
    consoleProps() {
      return {
        iframe: $iframe,
      }
    },
  })
  return new Cypress.Promise(resolve => {
    onIframeReady(
      $iframe,
      () => {
        resolve($iframe.contents().find('body'))
      },
      () => {
        $iframe.on('load', () => {
          resolve($iframe.contents().find('body'))
        })
      }
    )
  })
})

function onIframeReady($iframe, successFn, errorFn) {
  try {
    const iCon = $iframe.first()[0].contentWindow,
      bl = 'about:blank',
      compl = 'complete'
    const callCallback = () => {
      try {
        const $con = $iframe.contents()
        if ($con.length === 0) {
          // https://git.io/vV8yU
          throw new Error('iframe inaccessible')
        }
        successFn($con)
      } catch (e) {
        // accessing contents failed
        errorFn()
      }
    }
    const observeOnload = () => {
      $iframe.on('load.jqueryMark', () => {
        try {
          const src = $iframe.attr('src').trim(),
            href = iCon.location.href
          if (href !== bl || src === bl || src === '') {
            $iframe.off('load.jqueryMark')
            callCallback()
          }
        } catch (e) {
          errorFn()
        }
      })
    }
    if (iCon.document.readyState === compl) {
      const src = $iframe.attr('src').trim(),
        href = iCon.location.href
      if (href === bl && src !== bl && src !== '') {
        observeOnload()
      } else {
        callCallback()
      }
    } else {
      observeOnload()
    }
  } catch (e) {
    // accessing contentWindow failed
    errorFn()
  }
}
