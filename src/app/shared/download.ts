import { City, BusRoute } from '../types';

function download<T extends City | BusRoute>(data: T[], fileName: string) {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `${fileName}.json`;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

export default download;
