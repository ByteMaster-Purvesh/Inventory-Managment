import { createBrowserRouter } from 'react-router-dom';
import App from '../app/App';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Editor } from '../features/editor/Editor';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "editor/:id",
        element: <Editor />
      }
    ],
  }
]);
