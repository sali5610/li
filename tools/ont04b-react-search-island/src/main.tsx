import React from 'react';
import {createRoot} from 'react-dom/client';
import {SearchIsland} from './SearchIsland';
import './styles.css';
const root=document.getElementById('root');
if(!root)throw new Error('ONT-04B1 isolated mount target not found');
createRoot(root).render(<React.StrictMode><SearchIsland/></React.StrictMode>);
