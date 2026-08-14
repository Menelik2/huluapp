import React, {useEffect, useState, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {api} from '../api/client';
import {useAuth} from '../context/AuthContext';

const MessageRow = React.memo(function MessageRow({item, myId, isAdmin}) {
  const mine = item.sender_id === myId;
  return (
    <View style={[s.bubble, mine ? s.me : s.them]}>
      <Text style={s.bubbleLabel}>
        {mine ? 'You' : isAdmin ? 'Customer' : 'Admin'}
      </Text>
      <Text style={s.bubbleText}>{item.message}</Text>
    </View>
  );
});

export default function ChatScreen({route}) {
  const {user: authUser} = useAuth();
  const user = authUser || route.params?.user;
  const isAdmin = user?.role === 'admin';
  const [receiverId, setReceiverId] = useState(route.params?.receiverId || null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatUsers, setChatUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      try {
        if (isAdmin) {
          const r = await api.get('/admin/chat-users');
          if (cancelled) return;
          setChatUsers(r.data || []);
          if (!receiverId && r.data?.length) {
            setReceiverId(r.data[0].id);
          }
        } else if (!receiverId) {
          const r = await api.get('/chat/admin');
          if (cancelled) return;
          setReceiverId(r.data.id);
        }
      } catch (e) {
        Alert.alert('Chat setup', e.response?.data?.message || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const load = useCallback(() => {
    if (!receiverId) return Promise.resolve();
    return api
      .get('/chat/messages/' + receiverId)
      .then((r) => {
        const next = r.data.data || r.data || [];
        setMessages((prev) => {
          // Skip re-render if same length + last id
          if (
            prev.length === next.length &&
            prev.length > 0 &&
            prev[prev.length - 1].id === next[next.length - 1].id
          ) {
            return prev;
          }
          return next;
        });
      })
      .catch((e) =>
        Alert.alert('Chat error', e.response?.data?.message || e.message),
      );
  }, [receiverId]);

  useEffect(() => {
    if (receiverId) load();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (receiverId) load();
    }, 12000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [receiverId, load]);

  const send = useCallback(async () => {
    if (!message.trim() || !receiverId || sending) return;
    const body = message.trim();
    setMessage('');
    try {
      setSending(true);
      const res = await api.post('/chat/send', {
        receiver_id: receiverId,
        message: body,
      });
      const msg = res.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return prev.concat([msg]);
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd?.({animated: true});
      });
    } catch (e) {
      setMessage(body);
      Alert.alert('Chat error', e.response?.data?.message || e.message);
    } finally {
      setSending(false);
    }
  }, [message, receiverId, sending]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderMessage = useCallback(
    ({item}) => (
      <MessageRow item={item} myId={user?.id} isAdmin={isAdmin} />
    ),
    [user?.id, isAdmin],
  );

  const userChips = useMemo(() => {
    if (!isAdmin || !chatUsers.length) return null;
    return (
      <FlatList
        horizontal
        data={chatUsers}
        keyExtractor={(x) => String(x.id)}
        style={s.chips}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={8}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => setReceiverId(item.id)}>
            <Text
              style={[s.userChip, receiverId === item.id && s.userChipActive]}>
              {item.name || item.email}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  }, [isAdmin, chatUsers, receiverId]);

  if (loading) {
    return (
      <View style={[s.c, {justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.c}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      {userChips}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        contentContainerStyle={s.msgPad}
        initialNumToRender={20}
        maxToRenderPerBatch={15}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <Text style={s.empty}>No messages yet. Say hello.</Text>
        }
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd?.({animated: false})
        }
      />
      <View style={s.composer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type message"
          placeholderTextColor="#64748b"
          style={s.input}
        />
        <TouchableOpacity
          style={s.send}
          onPress={send}
          disabled={!receiverId || sending}>
          <Text style={s.sendT}>{sending ? '…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  c: {flex: 1, padding: 12, backgroundColor: '#0f172a'},
  chips: {maxHeight: 48, marginBottom: 8},
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '88%',
  },
  me: {alignSelf: 'flex-end', backgroundColor: '#1d4ed8'},
  them: {alignSelf: 'flex-start', backgroundColor: '#1e293b'},
  bubbleLabel: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  bubbleText: {color: '#f1f5f9'},
  empty: {textAlign: 'center', color: '#64748b', marginTop: 40},
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginRight: 8,
    color: '#cbd5e1',
    overflow: 'hidden',
  },
  userChipActive: {backgroundColor: '#2563eb', color: '#fff'},
  msgPad: {paddingBottom: 8},
  composer: {flexDirection: 'row', alignItems: 'center'},
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  send: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendT: {color: '#fff', fontWeight: '800'},
});
