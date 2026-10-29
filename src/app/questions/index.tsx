import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, Header, Row, Txt } from '@/components/ui';
import { useT, type StringKey } from '@/lib/i18n';
import { setPracticeQueue } from '@/lib/practice';
import { getTranslation, questionLabel, questionsFor, type Question } from '@/lib/questions';
import { useApp } from '@/lib/store';
import { maxContentWidth, radius, space, useTheme } from '@/lib/theme';

type Filter = 'all' | 'general' | 'state' | 'wrong' | 'starred' | 'new';
const FILTERS: [Filter, StringKey][] = [
  ['all', 'filterAll'],
  ['general', 'filterGeneral'],
  ['state', 'filterState'],
  ['new', 'filterNew'],
  ['wrong', 'filterWrong'],
  ['starred', 'filterStarred'],
];

export default function QuestionList() {
  const { settings, progress } = useApp();
  const t = useT();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const showTr = settings.practiceTranslations && settings.lang !== 'de';

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questionsFor(settings.state).filter((item) => {
      const s = progress.stats[item.id];
      if (filter === 'general' && item.s) return false;
      if (filter === 'state' && !item.s) return false;
      if (filter === 'wrong' && s?.r !== 2) return false;
      if (filter === 'starred' && !s?.star) return false;
      if (filter === 'new' && s?.r) return false;
      if (!q) return true;
      const tr = getTranslation(settings.lang, item.id);
      return (
        item.q.toLowerCase().includes(q) ||
        item.o.some((o) => o.toLowerCase().includes(q)) ||
        !!tr?.q.toLowerCase().includes(q) ||
        String(item.n) === q
      );
    });
  }, [filter, query, settings.state, settings.lang, progress.stats]);

  const open = (id: string) => {
    setPracticeQueue(items.map((i) => i.id));
    router.push({ pathname: '/questions/[id]', params: { id } });
  };

  const renderItem = ({ item }: { item: Question }) => {
    const s = progress.stats[item.id];
    const dot = s?.r === 1 ? c.success : s?.r === 2 ? c.danger : c.border;
    const tr = showTr ? getTranslation(settings.lang, item.id) : undefined;
    return (
      <Pressable
        onPress={() => open(item.id)}
        style={({ pressed }) => [styles.row, { backgroundColor: c.surface, borderColor: c.border }, pressed && { opacity: 0.75 }]}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="caption" muted>
            {questionLabel(item)}
          </Txt>
          <Txt variant="small" style={{ fontWeight: '500' }} numberOfLines={2}>
            {item.q}
          </Txt>
          {tr ? (
            <Txt variant="caption" muted numberOfLines={1} style={{ fontStyle: 'italic', fontWeight: '400' }}>
              {tr.q}
            </Txt>
          ) : null}
        </View>
        {s?.star ? <Ionicons name="star" size={16} color={c.accent} /> : null}
        <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <Header title={t('allQuestions')} />
      <View style={styles.top}>
        <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search')}
            placeholderTextColor={c.textMuted}
            style={[styles.input, { color: c.text }]}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>
          {FILTERS.map(([key, label]) => (
            <Chip key={key} label={t(label)} active={filter === key} onPress={() => setFilter(key)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        ListEmptyComponent={
          <Row style={{ justifyContent: 'center', paddingTop: space.xxl }}>
            <Txt muted>{t('noResults')}</Txt>
          </Row>
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md, paddingBottom: space.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 46,
  },
  input: { flex: 1, fontSize: 16, height: '100%', outlineStyle: 'none' } as object,
  list: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', paddingHorizontal: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
