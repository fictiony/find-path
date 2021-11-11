const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        components: {
          default: () => import('pages/Index.vue'),
          title: () => import('pages/TitleBar.vue'),
          operate: () => import('pages/panel/OperatePanel.vue')
        },
        children: [
          {
            path: '',
            components: {
              grid: () => import('pages/GridView.vue')
            }
          }
        ]
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
