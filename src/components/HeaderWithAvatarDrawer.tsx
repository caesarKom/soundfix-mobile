import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Avatar } from './Avatar';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAuthStore } from '../store/useAuthStore';
import { MEDIA_URL } from '../config/env';
import { notPerson } from '../utils/images';

const HeaderWithAvatarDrawer = () => {
  const { user } = useAuthStore.getState();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const avatarUrl = `${MEDIA_URL}/${user?.profile?.avatar}` || notPerson;
  const userName = user?.name || user?.email || 'User';

  return (
    <View style={s.container}>
      <View style={s.content}>
        <Avatar
          imageUrl={avatarUrl}
          name={userName}
          size={36}
          onPress={() => navigation.openDrawer()}
        />
        <View style={[s.badge, { marginLeft: 20 }]}>
          <Text style={s.text}>All</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.text}>Musics</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    maxHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginLeft: 20
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 200,
  },
  badge: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'grey',
    backgroundColor: 'green',
    padding: 4,
    width: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    height: 34,
    shadowColor: 'white',
    
  }
});

export default HeaderWithAvatarDrawer;
