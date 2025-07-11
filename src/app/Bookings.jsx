import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import styles from './App.module.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router';
import Welcome from './components/Welcome/Welcome';
import '@mantine/core/styles.css';
import { Burger, Container, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MantineProvider, Button } from '@mantine/core';
import classes from './HeaderSimple.module.css';

const links = [
  { link: '/', label: 'Browse Hotels' },
  { link: '/bookings', label: 'My Bookings' },
];

function Bookings() {

  // for header
  const [opened, { toggle }] = useDisclosure(false);
  const [active, setActive] = useState(links[0].link);
  const location = useLocation();
  const currentPath = location.pathname;
  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      className={classes.link}
      data-active={currentPath === link.link || undefined}
      onClick={(event) => {
        // event.preventDefault();
        setActive(link.link);
      }}
    >
      {link.label}
    </a>
  ));

  return <MantineProvider>
    {/* header */}
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Group gap={5} visibleFrom="xs">
          {items}
        </Group>

        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>

    {/* rest of code */}
    <div className={styles.App}>
      <header className={styles['App-header']}>
        <img src={logo} className={styles['App-logo']} alt="logo" />
        <Welcome />

        <p>
          <a
            className={styles['App-link']}
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className={styles['App-link']}
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  </MantineProvider>;
}

export default Bookings;
