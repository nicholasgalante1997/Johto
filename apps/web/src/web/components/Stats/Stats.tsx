import React from 'react';
import type { StatsProps } from './types';
import './Stats.css';

export function Stats({
  stats,
  layout = 'grid',
  columns = 4,
  className = '',
}: StatsProps) {
  const classNames = [
    'pokemon-stats',
    `pokemon-stats--${layout}`,
    layout === 'grid' && `pokemon-stats--columns-${columns}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      {stats.map((stat) => {
        const statClassNames = [
          'pokemon-stat',
          stat.color && `pokemon-stat--${stat.color}`,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={stat.id} className={statClassNames}>
            <div className="pokemon-stat__header">
              {stat.icon && <span className="pokemon-stat__icon">{stat.icon}</span>}
              <span className="pokemon-stat__label">{stat.label}</span>
            </div>
            <div className="pokemon-stat__content">
              <span className="pokemon-stat__value">{stat.value}</span>
              {stat.trend && stat.trendValue && (
                <span className={`pokemon-stat__trend pokemon-stat__trend--${stat.trend}`}>
                  {stat.trend === 'up' && '↑'}
                  {stat.trend === 'down' && '↓'}
                  {stat.trend === 'neutral' && '→'}
                  {stat.trendValue}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
