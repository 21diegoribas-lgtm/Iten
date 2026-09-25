import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { NotificationItem } from '../types';

export const NOTIFICATIONS_COLLECTION = 'notifications';

const parseFirestoreDateField = (val: unknown): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();

  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }

  return String(val);
};

function docToNotification(
  docSnap: DocumentSnapshot
): NotificationItem | null {
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  if (!data) {
    return null;
  }

  return {
    id: docSnap.id,
    title: typeof data.title === 'string' ? data.title : '',
    content: typeof data.content === 'string' ? data.content : '',
    senderId: typeof data.senderId === 'string' ? data.senderId : undefined,
    senderName:
      typeof data.senderName === 'string' ? data.senderName : '',
    senderRole:
      typeof data.senderRole === 'string' ? data.senderRole : '',
    targetClassId:
      typeof data.targetClassId === 'string'
        ? data.targetClassId
        : undefined,
    targetClassName:
      typeof data.targetClassName === 'string'
        ? data.targetClassName
        : undefined,
    targetStudentId:
      typeof data.targetStudentId === 'string'
        ? data.targetStudentId
        : undefined,
    targetStudentName:
      typeof data.targetStudentName === 'string'
        ? data.targetStudentName
        : undefined,
    targetTeam:
      typeof data.targetTeam === 'string'
        ? data.targetTeam
        : undefined,
    targetRole:
      data.targetRole === 'student' ||
      data.targetRole === 'teacher' ||
      data.targetRole === 'admin' ||
      data.targetRole === 'all'
        ? data.targetRole
        : undefined,
    targetType:
      data.targetType === 'all' ||
      data.targetType === 'class' ||
      data.targetType === 'team' ||
      data.targetType === 'student'
        ? data.targetType
        : undefined,
    createdAt: parseFirestoreDateField(data.createdAt),
    isRead: data.isRead === true,
  };
}

export async function getNotificationById(
  notificationId: string
): Promise<NotificationItem | null> {
  if (!notificationId) {
    return null;
  }

  const notificationRef = doc(
    db,
    NOTIFICATIONS_COLLECTION,
    notificationId
  );

  const snap = await getDoc(notificationRef);

  return docToNotification(snap);
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const notificationsRef = collection(
    db,
    NOTIFICATIONS_COLLECTION
  );

  const querySnapshot = await getDocs(notificationsRef);
  const notifications: NotificationItem[] = [];

  querySnapshot.forEach((docSnap) => {
    const notification = docToNotification(docSnap);

    if (notification) {
      notifications.push(notification);
    }
  });

  return notifications;
}

export async function setNotification(
  notification: NotificationItem
): Promise<void> {
  if (!notification.id) {
    throw new Error(
      'Notification ID is required to save notification'
    );
  }

  const notificationRef = doc(
    db,
    NOTIFICATIONS_COLLECTION,
    notification.id
  );

  const {
    id: _id,
    createdAt: _createdAt,
    ...data
  } = notification;

  await setDoc(
    notificationRef,
    {
      ...data,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateNotification(
  notificationId: string,
  updates: Partial<NotificationItem>
): Promise<void> {
  if (!notificationId) {
    throw new Error(
      'Notification ID is required to update notification'
    );
  }

  const notificationRef = doc(
    db,
    NOTIFICATIONS_COLLECTION,
    notificationId
  );

  const {
    id: _id,
    createdAt: _createdAt,
    ...data
  } = updates;

  await updateDoc(notificationRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNotification(
  notificationId: string
): Promise<void> {
  if (!notificationId) {
    throw new Error(
      'Notification ID is required to delete notification'
    );
  }

  const notificationRef = doc(
    db,
    NOTIFICATIONS_COLLECTION,
    notificationId
  );

  await deleteDoc(notificationRef);
}