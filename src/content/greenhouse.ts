import { profileStorage } from '../lib/storage'
import type { Profile } from '../types/jobs'

// Trigger React/framework-controlled inputs by bypassing the setter.
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

// Greenhouse puts LinkedIn in custom questions — no stable id/name, so scan labels.
function findLinkedInField(): HTMLInputElement | null {
  const byAttr = document.querySelector<HTMLInputElement>(
    'input[name*="linkedin" i], input[id*="linkedin" i], input[placeholder*="linkedin" i]',
  )
  if (byAttr) return byAttr

  for (const label of document.querySelectorAll<HTMLLabelElement>('label')) {
    if (!/linkedin/i.test(label.textContent ?? '')) continue
    const forId = label.getAttribute('for')
    if (forId) {
      const el = document.getElementById(forId)
      if (el instanceof HTMLInputElement) return el
    }
    // Try sibling / cousin input (Greenhouse wraps label + input in .field div)
    const field = label.closest('.field') ?? label.parentElement
    const el = field?.querySelector<HTMLInputElement>('input[type="text"], input[type="url"]')
    if (el) return el
  }
  return null
}

interface FillResult {
  filled: string[]
  skipped: string[]
}

function fillForm(profile: Profile): FillResult {
  const filled: string[] = []
  const skipped: string[] = []

  function tryFill(selector: string, value: string, label: string): void {
    if (!value.trim()) { skipped.push(label); return }
    const el = document.querySelector<HTMLInputElement>(selector)
    if (el) { setNativeValue(el, value.trim()); filled.push(label) }
    else { skipped.push(label) }
  }

  tryFill('#first_name', profile.firstName, 'First name')
  tryFill('#last_name', profile.lastName, 'Last name')
  tryFill('#email', profile.email, 'Email')
  tryFill('#phone', profile.phone, 'Phone')

  const linkedInEl = findLinkedInField()
  if (linkedInEl && profile.linkedIn.trim()) {
    setNativeValue(linkedInEl, profile.linkedIn.trim())
    filled.push('LinkedIn')
  } else if (profile.linkedIn.trim()) {
    skipped.push('LinkedIn')
  }

  // Resume is <input type="file"> — browsers block programmatic value setting.
  // The fill button highlights it visually to prompt the user.
  const resumeEl = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (resumeEl) {
    resumeEl.style.outline = '2px solid #0ea5e9'
    resumeEl.style.outlineOffset = '3px'
    resumeEl.scrollIntoView({ block: 'nearest' })
  }

  return { filled, skipped }
}

function injectFillButton(): void {
  const form = document.querySelector<HTMLFormElement>('#application_form')
  if (!form || document.getElementById('jobmatch-fill-wrapper')) return

  const wrapper = document.createElement('div')
  wrapper.id = 'jobmatch-fill-wrapper'
  Object.assign(wrapper.style, {
    marginBottom: '20px',
    padding: '12px 16px',
    background: '#0f172a',
    border: '1px solid #1e3a5f',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontFamily: 'system-ui, sans-serif',
  })

  const btn = document.createElement('button')
  btn.id = 'jobmatch-fill-btn'
  btn.type = 'button'
  btn.textContent = 'Fill with JobMatch'
  Object.assign(btn.style, {
    background: '#0ea5e9',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: '0',
  })
  btn.addEventListener('mouseover', () => { btn.style.background = '#0284c7' })
  btn.addEventListener('mouseout', () => { btn.style.background = '#0ea5e9' })

  const status = document.createElement('span')
  Object.assign(status.style, { fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' })

  btn.addEventListener('click', () => void (async () => {
    btn.disabled = true
    btn.textContent = 'Filling…'
    status.textContent = ''

    const profile = await profileStorage.get()
    if (!profile) {
      status.style.color = '#f87171'
      status.textContent = 'No profile saved — open JobMatch → Settings → Profile.'
      btn.disabled = false
      btn.textContent = 'Fill with JobMatch'
      return
    }

    const { filled, skipped } = fillForm(profile)
    btn.disabled = false
    btn.textContent = 'Fill with JobMatch'

    if (filled.length === 0) {
      status.style.color = '#f87171'
      status.textContent = 'No fields matched on this page.'
      return
    }

    status.style.color = '#34d399'
    let msg = `Filled: ${filled.join(', ')}.`
    if (skipped.length) msg += `  Skipped: ${skipped.join(', ')}.`
    const hasFile = !!document.querySelector('input[type="file"]')
    if (hasFile) msg += '  Upload your resume manually (highlighted above).'
    status.textContent = msg
  })())

  wrapper.appendChild(btn)
  wrapper.appendChild(status)
  form.prepend(wrapper)
}

function tryInject(): void {
  if (document.querySelector('#application_form')) injectFillButton()
}

tryInject()

const observer = new MutationObserver(() => {
  if (document.querySelector('#application_form') && !document.getElementById('jobmatch-fill-wrapper')) {
    injectFillButton()
  }
})
observer.observe(document.body, { childList: true, subtree: true })
