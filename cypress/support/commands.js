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

Cypress.Commands.add(
  'iframeLoaded',
  { prevSubject: 'element' },
  ($iframe) => {
    const contentWindow = $iframe.prop('contentWindow')
    return new Promise(resolve => {
      if (
        contentWindow &&
        contentWindow.document.readyState === 'complete'
      ) {
        resolve(contentWindow)
      } else {
        $iframe.on('load', () => {
          resolve(contentWindow)
        })
      }
    })
  })

Cypress.Commands.add(
  'getInDocument',
  { prevSubject: 'window' },
  ({ document }, selector) => Cypress.$(selector, document)
)

Cypress.Commands.add(
  'iframeElementLoaded',
  (targetElement, { timeout = 15000 } = {}) => {
    const retryInterval = 250 // ms
    const retries = Math.ceil(timeout / retryInterval)
    cy.log('load element ', targetElement)
    cy.get('iframe', { log: false })
    .iframeLoaded()
    .then({ timeout: timeout + 1000 }, async window => {
      await retryEvery(() => {
          const res = Cypress.$(targetElement, window.document)
          console.log('result: ', res)
          if (res.length === 0) {
            throw new Error('timeout exceeded: no element found')
          }
        },
        {initialRetryTimer: retryInterval, increaseFactor: 1, maxRetries: retries}
      )
    })
  }
)

Cypress.Commands.add(
  'getWithinIframe',
  (targetElement, { timeout = 60000 } = {}) => {
    cy.log('get element ', targetElement)
    cy.iframeElementLoaded(targetElement, { timeout })
    .getInDocument(targetElement)
  }
)

const retryEvery = async (
  callback,
  { initialRetryTimer = 1000, increaseFactor = 3, maxRetries = 3 } = {}
) => {
  const sleep = time => new Promise(resolve => setTimeout(resolve, time))

  let retryNum = 0
  const attempt = async (retryTimer = initialRetryTimer) => {
    try {
      return await callback()
    } catch (err) {
      if (retryNum === maxRetries) {
        throw err
      }
      ++retryNum

      // Exponentially backoff attempts if increaseFactor > 1
      const nextRetryTime = retryTimer * increaseFactor
      console.log(
        `Retrying in ${nextRetryTime}ms... (attempt ${retryNum} of ${maxRetries})`
      )
      await sleep(nextRetryTime)
      return attempt(nextRetryTime)
    }
  }

  return attempt()
}
