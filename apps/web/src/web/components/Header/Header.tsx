import React from 'react';

function Header() {
  return (
    <header>
      <a>
        <span>
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 0C12.268 0 6 6.268 6 14C6 21.732 12.268 28 20 28C27.732 28 34 21.732 34 14C34 6.268 27.732 0 20 0Z"
              fill="#68A0F6"
            />
            <path
              d="M20 12C15.5817 12 12 15.5817 12 20C12 24.4183 15.5817 28 20 28C24.4183 28 28 24.4183 28 20C28 15.5817 24.4183 12 20 12Z"
              fill="#F87474"
            />
            <path
              d="M14 16C12.3431 16 11 17.3431 11 19C11 20.6569 12.3431 22 14 22C15.6569 22 17 20.6569 17 19C17 17.3431 15.6569 16 14 16Z"
              fill="#F8D568"
            />
          </svg>
        </span>
        <h1>Porygon</h1>
      </a>
    </header>
  );
}

export default Header;
