import { v4 as uuidv4 } from 'uuid';

const BROWSER_ID_KEY = 'viro_browser_id';

export function getBrowserId(): string {
  let browserId = localStorage.getItem(BROWSER_ID_KEY);
  
  if (!browserId) {
    browserId = uuidv4();
    localStorage.setItem(BROWSER_ID_KEY, browserId);
  }
  
  return browserId;
}