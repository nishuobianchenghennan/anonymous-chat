import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import SystemAuth from '@/views/SystemAuth.vue'
import RoomAuth from '@/views/RoomAuth.vue'
import ChatRoom from '@/views/ChatRoom.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'SystemAuth',
    component: SystemAuth
  },
  {
    path: '/room-auth',
    name: 'RoomAuth',
    component: RoomAuth
  },
  {
    path: '/chat/:roomId',
    name: 'ChatRoom',
    component: ChatRoom
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
