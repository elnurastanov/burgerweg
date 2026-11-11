import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, type Href } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ProgressRings } from '@/components/progress-rings';
import { Card, IconButton, Row, Screen, Txt, type IconName } from '@/components/ui';
import { dateLocale, useT } from '@/lib/i18n';
import { EXAM, stateName } from '@/lib/questions';
import { formatDuration, useStats } from '@/lib/stats';
import { useApp } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';

export default function Home() {
  const { settings, progress } = useApp();
  const stats = useStats();
  const t = useT();
  const { c } = useTheme();
  // Very narrow phones: stack the rings above the stats. From 340 px they sit side by side.
  const compact = useWindowDimensions().width < 340;

  if (!settings.onboarded || !settings.state) return <Redirect href="/onboarding" />;

  // The ring's green arc and this number show correctly answered questions; readiness still uses mastery.
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
  const locale = dateLocale(settings.lang);

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
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="caption" muted style={styles.overline}>
              {t('progress').toUpperCase()}
            </Txt>
            <View style={[styles.readiness, { backgroundColor: c.surfaceAlt }]} accessibilityLabel={`${t('readiness')}: ${t(stats.readiness)}`}>
              <Ionicons name="sparkles-outline" size={14} color={c.accent} />
              <Txt variant="small" style={{ fontWeight: '600' }}>
                {t(stats.readiness)}
              </Txt>
            </View>
          </Row>
          <View style={[styles.progressBody, compact && styles.progressCompact]}>
            <ProgressRings
              size={100}
              outer={[
                { value: stats.total ? stats.correct / stats.total : 0, color: c.primary },
                { value: stats.total ? stats.wrong / stats.total : 0, color: c.danger },
              ]}
              inner={{ value: stats.goal ? stats.today / stats.goal : 0, color: c.accent }}>
              <Txt variant="heading" style={{ fontSize: 22 }}>
                {pct}%
              </Txt>
            </ProgressRings>
            <View style={[{ gap: space.xs }, compact ? { alignSelf: 'stretch' } : { flex: 1 }]}>
              <Stat dot={c.primary} label={t('correct')} value={`${stats.correct}/${stats.total}`} />
              <Stat dot={c.danger} label={t('toReview')} value={String(stats.wrong)} color={stats.wrong ? c.danger : undefined} />
              <Stat dot={c.accent} label={t('today')} value={`${stats.today}/${stats.goal}`} />
              <View style={[styles.sep, { backgroundColor: c.border }]} />
              <Stat label={t('examsPassed')} value={`${stats.passedExams} ${t('of')} ${stats.examsTaken}`} />
            </View>
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

function Stat({ label, value, color, dot }: { label: string; value: string; color?: string; dot?: string }) {
  return (
    <Row gap={space.sm} style={{ justifyContent: 'space-between' }}>
      <Row gap={6} style={{ flexShrink: 1 }}>
        {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
        <Txt variant="small" muted style={{ flexShrink: 1 }}>
          {label}
        </Txt>
      </Row>
      <Txt variant="small" color={color} style={{ fontWeight: '700' }}>
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
  progressBody: { marginTop: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  progressCompact: { flexDirection: 'column', gap: space.lg },
  readiness: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  sep: { height: StyleSheet.hairlineWidth, marginVertical: space.xs },
  featureIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  examRow: { paddingVertical: space.md },
});
