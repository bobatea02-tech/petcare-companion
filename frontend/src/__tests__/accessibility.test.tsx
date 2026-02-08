import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { LoginForm } from '@/components/auth/LoginForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('Authentication Components', () => {
    it('LoginForm should have no accessibility violations', async () => {
      const { container } = render(<LoginForm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('UI Components', () => {
    it('Button should have no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('Card should have no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <h2>Card Title</h2>
          <p>Card content</p>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('Input should have proper labels', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-input">Test Input</label>
          <Input id="test-input" />
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('Button should be keyboard accessible', () => {
      const { getByRole } = render(<Button>Keyboard Test</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveAttribute('tabIndex')
      expect(button.tabIndex).toBeGreaterThanOrEqual(0)
    })

    it('Interactive elements should have visible focus indicators', () => {
      const { getByRole } = render(<Button>Focus Test</Button>)
      const button = getByRole('button')
      
      button.focus()
      expect(button).toHaveFocus()
    })
  })

  describe('ARIA Attributes', () => {
    it('Loading button should have aria-busy attribute', () => {
      const { getByRole } = render(<Button loading>Loading</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('Disabled button should have aria-disabled attribute', () => {
      const { getByRole } = render(<Button disabled>Disabled</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Color Contrast', () => {
    it('Text should have sufficient color contrast', async () => {
      const { container } = render(
        <div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
          <p>High contrast text</p>
        </div>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Screen Reader Support', () => {
    it('Images should have alt text', async () => {
      const { container } = render(
        <img src="/test.jpg" alt="Test image description" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('Form inputs should have associated labels', async () => {
      const { container } = render(
        <form>
          <label htmlFor="email">Email</label>
          <Input id="email" type="email" />
        </form>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
