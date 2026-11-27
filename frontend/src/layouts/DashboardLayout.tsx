import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'

const navigation = [
  { label: 'Overview', icon: 'grid' as const, disabled: true },
  { label: 'My Batches', icon: 'layers' as const, to: '/batches' },
  { label: 'Students', icon: 'users' as const, disabled: true },
  { label: 'Courses', icon: 'book' as const, disabled: true },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  return (
    <div className="dashboard-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <Link className="brand" to="/batches" aria-label="Noor AI Labs home">
          <span className="brand-mark"><Icon name="sparkle" size={21} /></span>
          <span className="brand-copy">
            <strong>Noor AI Labs</strong>
            <small>Learning platform</small>
          </span>
        </Link>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = item.to === '/batches' && location.pathname.startsWith('/batches')
            const className = `nav-item${active ? ' nav-item-active' : ''}${item.disabled ? ' nav-item-disabled' : ''}`

            return item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={className}
                aria-current={active ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button key={item.label} type="button" className={className} disabled>
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Icon name="sparkle" size={17} /></span>
            <strong>Need a hand?</strong>
            <p>Our team is here to help you.</p>
            <button type="button" disabled>Get support <span aria-hidden="true">↗</span></button>
          </div>
          <div className="sidebar-user">
            <span className="avatar avatar-sidebar">NA</span>
            <span className="sidebar-user-copy"><strong>Staff workspace</strong><small>Django staff account</small></span>
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span><Icon name="chevron-right" size={15} /><strong>My Batches</strong>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-button notification-button" aria-label="Notifications">
              <Icon name="bell" size={19} />
              <span className="notification-dot" />
            </button>
            <span className="profile-button">
              <span className="avatar">ST</span>
              <span className="profile-copy"><strong>Staff workspace</strong><small>Django staff account</small></span>
            </span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
