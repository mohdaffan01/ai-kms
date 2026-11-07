import React from 'react';

/**
 * DashboardSkeleton
 * High-fidelity Shimmer/Skeleton loading placeholder for Dashboard Overview.
 * Accurately mirrors the 3-section layout (Overview Stats, My Vaults, Learning Progress)
 * to provide a seamless, zero-flash transition while dashboard data loads.
 */
const DashboardSkeleton = () => {
  return (
    <div
      className="dashboard-content-layout dashboard-skeleton-layout"
      aria-busy="true"
      aria-label="Loading study dashboard"
    >
      {/* 1. Overview Section Skeleton */}
      <section className="dashboard-section section-overview">
        <div className="section-title-wrap">
          <div className="skeleton-line skeleton-heading" style={{ width: 120, height: 26 }} />
        </div>
        <div className="overview-stats-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="stat-card skeleton-card">
              <div className="stat-card-top">
                <div className="skeleton-line" style={{ width: '58%', height: 14 }} />
                <div className="skeleton-circle" style={{ width: 34, height: 34 }} />
              </div>
              <div className="stat-card-body">
                <div className="skeleton-line" style={{ width: '42%', height: 28, margin: '8px 0 6px' }} />
                <div className="skeleton-line" style={{ width: '78%', height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. My Vaults (Subject Cards) Section Skeleton */}
      <section className="dashboard-section section-subjects">
        <div className="section-title-wrap with-action">
          <div className="skeleton-line skeleton-heading" style={{ width: 130, height: 26 }} />
          <div className="skeleton-btn" style={{ width: 110, height: 34, borderRadius: 8 }} />
        </div>
        <div className="subjects-cards-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="subject-card skeleton-card">
              <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="skeleton-box" style={{ width: 42, height: 42, borderRadius: 10 }} />
                    <div className="skeleton-line" style={{ width: 120, height: 18 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div className="skeleton-line" style={{ width: 44, height: 16 }} />
                    <div className="skeleton-line" style={{ width: 72, height: 12 }} />
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="skeleton-line" style={{ width: '100%', height: 6, borderRadius: 999 }} />

                {/* Card footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    paddingTop: 10,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="skeleton-line" style={{ width: 55, height: 14 }} />
                  <div className="skeleton-btn" style={{ width: 95, height: 28, borderRadius: 6 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Learning Progress Analytics Section Skeleton */}
      <section className="dashboard-section section-analytics">
        <div className="section-title-wrap">
          <div className="skeleton-line skeleton-heading" style={{ width: 180, height: 26 }} />
        </div>
        <div className="learning-progress-grid">
          {/* Left: Overall Learning Progress Hero Skeleton */}
          <div className="progress-hero-card skeleton-card">
            <div className="progress-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="skeleton-circle" style={{ width: 20, height: 20 }} />
                <div className="skeleton-line" style={{ width: 170, height: 16 }} />
              </div>
              <div className="skeleton-btn" style={{ width: 110, height: 24, borderRadius: 999 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0.6rem 0' }}>
              <div className="skeleton-circle" style={{ width: 100, height: 100, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <div className="skeleton-line" style={{ width: '85%', height: 14 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div className="skeleton-box" style={{ height: 48, borderRadius: 8 }} />
                  <div className="skeleton-box" style={{ height: 48, borderRadius: 8 }} />
                  <div className="skeleton-box" style={{ height: 48, borderRadius: 8 }} />
                </div>
              </div>
            </div>

            <div className="skeleton-line" style={{ width: 180, height: 24, borderRadius: 6, marginTop: 'auto' }} />
          </div>

          {/* Right: Subject-Wise Progress Skeleton */}
          <div className="subject-wise-card skeleton-card">
            <div className="progress-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="skeleton-circle" style={{ width: 20, height: 20 }} />
                <div className="skeleton-line" style={{ width: 160, height: 16 }} />
              </div>
              <div className="skeleton-btn" style={{ width: 80, height: 22, borderRadius: 6 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '0.6rem 0' }}>
              {[1, 2, 3].map((r) => (
                <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton-line" style={{ width: 100, height: 14 }} />
                    <div className="skeleton-line" style={{ width: 55, height: 14 }} />
                  </div>
                  <div className="skeleton-line" style={{ width: '100%', height: 8, borderRadius: 999 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardSkeleton;

