'use client';

import { usePathname } from 'next/navigation';

export default function BottomTabbar() {
  const pathname = usePathname();
  const isMap = pathname === '/toronto/map';
  const isCalendar = pathname.startsWith('/toronto/calendar');
  const isExplore = !isMap && !isCalendar;

  return (
    <nav className="bottom-tabbar">
      <a href="/toronto" className={`tab-item${isExplore ? ' on' : ''}`}>
        <span className="tab-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              fill="currentColor"
              d="m8.154 15.846l5.808-1.884l1.884-5.808l-5.807 1.885zm3.842-2.73q-.467 0-.79-.327q-.321-.327-.321-.793q0-.467.326-.79q.327-.321.793-.321q.467 0 .79.326q.322.327.322.793q0 .467-.327.79q-.327.322-.793.322M12.003 21q-1.867 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.344 0 5.672-2.328T20 12t-2.328-5.672T12 4T6.328 6.328T4 12t2.328 5.672T12 20m0-8"
            />
          </svg>
        </span>
        Explore
      </a>
      <a href="/toronto/map" className={`tab-item${isMap ? ' on' : ''}`}>
        <span className="tab-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              fill="currentColor"
              d="m15 19.923l-6-2.1l-3.958 1.53q-.384.143-.713-.083T4 18.634V6.404q0-.268.13-.489t.378-.307L9 4.077l6 2.1l3.958-1.53q.384-.143.713.054t.329.588v12.384q0 .287-.159.498q-.158.212-.426.298zm-.5-1.22v-11.7l-5-1.745v11.7zm1 0L19 17.55V5.7l-3.5 1.304zM5 18.3l3.5-1.342v-11.7L5 6.45zM15.5 7.004v11.7zm-7-1.746v11.7z"
            />
          </svg>
        </span>
        Map
      </a>
      <a href="/toronto/calendar" className={`tab-item${isCalendar ? ' on' : ''}`}>
        <span className="tab-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              fill="currentColor"
              d="M18.438 4.954H16.5V3.546c0-.262-.23-.512-.5-.5a.51.51 0 0 0-.5.5v1.408h-7V3.546c0-.262-.23-.512-.5-.5a.51.51 0 0 0-.5.5v1.408H5.562a2.503 2.503 0 0 0-2.5 2.5v11c0 1.379 1.122 2.5 2.5 2.5h12.875c1.379 0 2.5-1.121 2.5-2.5v-11a2.5 2.5 0 0 0-2.499-2.5m-12.876 1H7.5v.592c0 .262.23.512.5.5c.271-.012.5-.22.5-.5v-.592h7v.592c0 .262.23.512.5.5c.271-.012.5-.22.5-.5v-.592h1.937c.827 0 1.5.673 1.5 1.5v1.584H4.062V7.454c0-.827.673-1.5 1.5-1.5m12.876 14H5.562c-.827 0-1.5-.673-1.5-1.5v-8.416h15.875v8.416a1.5 1.5 0 0 1-1.499 1.5"
            />
          </svg>
        </span>
        Calendar
      </a>
    </nav>
  );
}
