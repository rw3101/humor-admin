'use client'

export default function ConfirmButton({
  action,
  message,
  children,
  className,
  name,
  value,
}: {
  action: (formData: FormData) => void | Promise<void>
  message: string
  children: React.ReactNode
  className?: string
  name?: string
  value?: string
}) {
  return (
    <button
      type="submit"
      formAction={action}
      name={name}
      value={value}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}