import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const avatars = [
  { id: 1, uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix' },
  { id: 2, uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka' },
  { id: 3, uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Max' },
  { id: 4, uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Luna' },
  { id: 5, uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Alex' },
  { id: 6, uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sophie' },
];

export const AvatarPicker = ({ selectedAvatar, onSelectAvatar }) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const renderAvatarOption = ({ item }) => (
    <TouchableOpacity
      style={styles.avatarOption}
      onPress={() => {
        onSelectAvatar(item.uri);
        setModalVisible(false);
      }}
    >
      <Image source={{ uri: item.uri }} style={styles.avatarImage} />
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.container}>
        <Image
          source={{ uri: selectedAvatar || avatars[0].uri }}
          style={styles.selectedAvatar}
        />
        <View style={styles.editBadge}>
          <FontAwesome5 name="pen" size={12} color="#FFF" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={avatars}
              renderItem={renderAvatarOption}
              keyExtractor={item => item.id.toString()}
              numColumns={3}
              contentContainerStyle={styles.avatarGrid}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 15,
  },
  selectedAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#388E3C',
    padding: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  avatarGrid: {
    paddingVertical: 10,
  },
  avatarOption: {
    flex: 1/3,
    padding: 10,
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
