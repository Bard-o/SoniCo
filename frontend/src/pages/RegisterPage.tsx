import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Music } from 'lucide-react'

/**
 * Registration page using Supabase Auth UI.
 * Redirects to /dashboard if already authenticated.
 * All user-facing text in Spanish.
 */
export default function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-12">
      <div
        className="w-full max-w-md p-8 rounded-lg border"
        style={{
          backgroundColor: '#ffffff',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Music size={24} style={{ color: 'var(--color-on-primary)' }} />
            </div>
          </div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--color-on-surface)' }}
          >
            Crear cuenta
          </h1>
          <p
            className="text-sm mt-2"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            Regístrate en AudioQBox para reservar salas y alquilar equipos
          </p>
        </div>

        {/* Supabase Auth UI */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#004ac6',
                  inputBorder: '#c3c6d7',
                  inputText: '#191b23',
                  inputBackground: '#ffffff',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '0.375rem',
                  buttonBorderRadius: '0.375rem',
                  inputBorderRadius: '0.25rem',
                },
                fonts: {
                  bodyFontFamily: '"Inter", system-ui, sans-serif',
                  buttonFontFamily: '"Inter", system-ui, sans-serif',
                  inputFontFamily: '"Inter", system-ui, sans-serif',
                  labelFontFamily: '"Inter", system-ui, sans-serif',
                },
              },
            },
          }}
          providers={['google']}
          view="sign_up"
          localization={{
            variables: {
              sign_up: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                email_input_placeholder: 'tu@correo.com',
                password_input_placeholder: 'Crea una contraseña (mínimo 6 caracteres)',
                button_label: 'Crear cuenta',
                loading_button_label: 'Creando cuenta...',
                social_provider_text: 'Continuar con {{provider}}',
                link_text: '¿No tienes cuenta? Regístrate',
              },
              sign_in: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                email_input_placeholder: 'tu@correo.com',
                password_input_placeholder: 'Tu contraseña',
                button_label: 'Iniciar sesión',
                loading_button_label: 'Iniciando sesión...',
                social_provider_text: 'Continuar con {{provider}}',
                link_text: '¿Ya tienes cuenta? Inicia sesión',
              },
              forgotten_password: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                email_input_placeholder: 'tu@correo.com',
                button_label: 'Enviar instrucciones',
                loading_button_label: 'Enviando...',
                link_text: '¿Olvidaste tu contraseña?',
              },
            },
          }}
          redirectTo={window.location.origin + '/dashboard'}
        />
      </div>
    </div>
  )
}
