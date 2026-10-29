import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, type Href } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ProgressRing } from '@/components/progress-ring';
import { Card, IconButton, Row, Screen, Txt, type IconName } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { EXAM, stateName } from '@/lib/questions';
import { formatDuration, useStats } from '@/lib/stats';
import { useApp } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';

export default function Home() {
  const { settings, progress } = useApp();
  const stats = useStats();
  const t = useT();
  const { c } = useTheme();
  // Phones: stack the progress section and center it. Wider screens keep ring and stats side by side.
  const compact = useWindowDimensions().width < 520;

  if (!settings.onboarded || !settings.state) return <Redirect href="/onboarding" />;

  const pct = Math.round(stats.ratio * 100);
  const locale = settings.lang === 'de' ? 'de-DE' : 'en-GB';

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(450)}>
        <Row style={{ marginTop: space.lg, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="title">{progress.updatedAt ? t('greeting') : t('greetingNew')}</Txt>
            <Row gap={6}>
              <Ionicons name="location-outline" size={15} color={c.textMuted} />
              <Txt variant="small" muted>
                {stateName(settings.state, settings.lang)}
              </Txt>
            </Row>
          </View>
          <IconButton icon="settings-outline" onPress={() => router.push('/settings')} accessibilityLabel={t('settings')} />
        </Row>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(60)}>
        <Card>
          <Txt variant="caption" muted style={[styles.overline, compact && { textAlign: 'center' }]}>
            {t('progress').toUpperCase()}
          </Txt>
          <View style={[styles.progressBody, compact ? styles.progressCompact : styles.progressWide]}>
            <ProgressRing value={stats.ratio} size={124}>
              <Txt variant="title">{pct}%</Txt>
              <Txt variant="caption" muted>
                {t('mastered')}
              </Txt>
            </ProgressRing>
            <View style={[{ gap: space.sm }, compact ? { alignSelf: 'stretch' } : { flex: 1 }]}>
              <Stat label={t('answered')} value={`${stats.answered} ${t('of')} ${stats.total}`} />
              <Stat label={t('correct')} value={String(stats.correct)} color={c.success} />
              <Stat label={t('toReview')} value={String(stats.wrong)} color={stats.wrong ? c.danger : undefined} />
              <Stat label={t('examsPassed')} value={`${stats.passedExams} ${t('of')} ${stats.examsTaken}`} />
            </View>
          </View>
          <View style={[styles.readiness, { backgroundColor: c.surfaceAlt }, compact && { alignSelf: 'center' }]}>
            <Ionicons name="sparkles-outline" size={16} color={c.accent} />
            <Txt variant="small" muted>
              {t('readiness')}:
            </Txt>
            <Txt variant="small" style={{ fontWeight: '600' }}>
              {t(stats.readiness)}
            </Txt>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(120)} style={{ gap: space.md }}>
        <Feature
          icon="list-outline"
          title={t('allQuestions')}
          sub={t('allQuestionsSub', { count: stats.total, done: stats.answered })}
          href="/questions"
          tint={c.primary}
          soft={c.primarySoft}
        />
        <Feature
          icon="timer-outline"
          title={t('examSimulator')}
          sub={t('examSimulatorSub')}
          href="/exam"
          tint={c.accent}
          soft={c.accentSoft}
        />
        <Feature
          icon="albums-outline"
          title={t('flashcards')}
          sub={t('flashcardsSub')}
          href="/flashcards"
          tint={c.success}
          soft={c.successSoft}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(450).delay(180)} style={{ gap: space.sm }}>
        <Txt variant="heading">{t('recentExams')}</Txt>
        {progress.exams.length === 0 ? (
          <Card tone="alt">
            <Txt variant="small" muted>
              {t('noExamsYet')}
            </Txt>
          </Card>
        ) : (
          <Card style={{ paddingVertical: space.sm }}>
            {progress.exams.slice(0, 5).map((e, i) => {
              const ok = e.score >= EXAM.passMark;
              return (
                <Row key={e.t} style={[styles.examRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={ok ? c.success : c.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="label">
                      {e.score}/{e.total} · {ok ? t('passed') : t('failed')}
                    </Txt>
                    <Txt variant="caption" muted>
                      {new Date(e.t).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                      {formatDuration(e.seconds)}
                    </Txt>
                  </View>
                </Row>
              );
            })}
          </Card>
        )}
      </Animated.View>

      <Card tone="alt" onPress={() => router.push('/transfer')}>
        <Row>
          <Ionicons name="swap-horizontal-outline" size={20} color={c.primary} />
          <Txt variant="label" style={{ flex: 1 }}>
            {t('transferProgress')}
          </Txt>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </Row>
      </Card>
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt variant="small" muted>
        {label}
      </Txt>
      <Txt variant="label" color={color}>
        {value}
      </Txt>
    </Row>
  );
}

function Feature({
  icon,
  title,
  sub,
  href,
  tint,
  soft,
}: {
  icon: IconName;
  title: string;
  sub: string;
  href: Href;
  tint: string;
  soft: string;
}) {
  const { c } = useTheme();
  return (
    <Card onPress={() => router.push(href)}>
      <Row gap={space.lg}>
        <View style={[styles.featureIcon, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={24} color={tint} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{title}</Txt>
          <Txt variant="small" muted>
            {sub}
          </Txt>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  overline: { letterSpacing: 1.2 },
  progressBody: { marginTop: space.md, gap: space.xl },
  progressCompact: { flexDirection: 'column', alignItems: 'center', gap: space.lg },
  progressWide: { flexDirection: 'row', alignItems: 'center' },
  readiness: {
    marginTop: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  featureIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  examRow: { paddingVertical: space.md },
});
