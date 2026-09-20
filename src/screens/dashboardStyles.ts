import { StyleSheet } from 'react-native';
import { authColors, fontFamilies, liftStyle } from './authStyles';

export { authColors, fontFamilies, liftStyle };

export function makeDashboardStyles() {
  return StyleSheet.create({
    shell: {
      flex: 1,
      minHeight: '100%',
      flexDirection: 'row',
      backgroundColor: authColors.pageBg,
    },

    // Sidebar
    sidebar: {
      width: 264,
      backgroundColor: authColors.pageBg,
      borderRightWidth: 1,
      borderRightColor: authColors.divider,
      paddingVertical: 28,
      paddingHorizontal: 20,
      justifyContent: 'space-between',
    },
    sidebarTop: {},
    sidebarLogo: { width: 150, height: 50, alignSelf: 'center' },
    sidebarTagline: {
      textAlign: 'center',
      fontFamily: fontFamilies.displayRegular,
      fontSize: 12,
      color: authColors.textSecondary,
      marginTop: 8,
      marginBottom: 40,
      lineHeight: 16,
    },
    // Sized/spaced to absorb the room the removed "A1 progress" card used
    // to take, without adding any new element — bigger touch target, more
    // breathing room between items, instead of a dead gap before the quote
    // card (which `sidebar`'s justify-content: space-between already pins
    // to the very bottom).
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderRadius: 16,
      marginBottom: 14,
    },
    navItemActive: {
      backgroundColor: 'rgba(37, 99, 235, 0.28)',
      borderWidth: 1,
      borderColor: authColors.accentCyan,
      shadowColor: authColors.accentCyan,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 4,
    },
    navItemIcon: { fontSize: 17, width: 20, textAlign: 'center' },
    navItemLabel: { fontFamily: fontFamilies.displaySemiBold, fontSize: 16, color: authColors.textSecondary },
    navItemLabelActive: { color: authColors.textPrimary },
    sidebarBottom: {},
    sidebarQuoteCard: {
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 16,
      padding: 22,
      marginBottom: 14,
    },
    sidebarQuoteFlag: { fontSize: 20, marginBottom: 8 },
    sidebarQuoteLu: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.textPrimary, lineHeight: 18 },
    sidebarQuotePt: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: authColors.textSecondary, marginTop: 6 },
    sidebarCopyright: {
      textAlign: 'center',
      fontFamily: fontFamilies.displayRegular,
      fontSize: 10,
      color: authColors.textMuted,
      lineHeight: 15,
    },

    // Mobile top bar (narrow layout replacement for the sidebar header)
    mobileTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 8,
    },
    mobileLogo: { width: 34, height: 34 },
    mobileLogoText: { fontFamily: fontFamilies.displayExtraBold, fontSize: 16, color: authColors.textPrimary },

    // Content area
    contentArea: { flex: 1 },
    contentScroll: { paddingBottom: 60 },

    // Top bar (search + stats + profile)
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      paddingHorizontal: 28,
      paddingTop: 24,
      paddingBottom: 20,
      position: 'relative',
      zIndex: 10,
    },
    searchWrapper: {
      flex: 1,
      minWidth: 200,
      maxWidth: 420,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 46,
    },
    searchInput: { flex: 1, fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textPrimary },
    statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
    // Without an explicit width, a wrapped flex item can still report its
    // own *unwrapped* content width upward and overflow the viewport — this
    // pins it to the line's available width so its own children truly wrap.
    statsRowNarrow: { width: '100%' },
    statPill: {
      alignItems: 'center',
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 14,
      minWidth: 76,
    },
    statPillValue: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: authColors.textPrimary },
    statPillLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 10, color: authColors.textSecondary, marginTop: 2 },
    profilePillWrap: { position: 'relative' },
    profilePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 10,
      paddingRight: 14,
    },
    profileAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: authColors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarText: { color: '#FFFFFF', fontFamily: fontFamilies.displayBold, fontSize: 13 },
    profilePillName: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.textPrimary },
    profileMenu: {
      position: 'absolute',
      top: 52,
      right: 0,
      width: 180,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 14,
      paddingVertical: 6,
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
    },
    profileMenuItem: { paddingVertical: 10, paddingHorizontal: 16 },
    profileMenuItemText: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textPrimary },
    profileMenuDanger: { color: authColors.danger },

    // Hero + progress row
    heroRow: {
      flexDirection: 'row',
      gap: 20,
      paddingHorizontal: 28,
      marginBottom: 28,
      alignItems: 'stretch',
    },
    heroRowNarrow: { flexDirection: 'column' },
    hero: {
      flex: 2,
      borderRadius: 28,
      overflow: 'hidden',
      minHeight: 320,
    },
    // `flex: 2/1` above sizes hero/progressCard as a share of the ROW's
    // width when side by side, and that row-stretch is also what gives
    // `hero` a definite height in wide mode (needed for the background
    // image to size itself — react-native-web's Image resolves its fill
    // against the parent's height, and falls back to the raw photo's
    // intrinsic pixel size if that parent has no definite height, blowing
    // the banner up and making it overlay the next section instead of
    // pushing it down). Once heroRowNarrow stacks things into a column,
    // nothing gives `hero` a definite height any more, so it needs an
    // explicit one here instead of just resetting flex.
    heroNarrow: { flex: 0, height: 380 },
    heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    heroContent: { flex: 1, padding: 28, justifyContent: 'center' },
    // Mirrors the reasoning above: centering via flex:1 only makes sense
    // once wide-mode row-stretch gives `hero` a real height to center
    // within. Stacked, content just flows top-down inside the fixed height.
    heroContentNarrow: { flex: 0, justifyContent: 'flex-start', paddingVertical: 24 },
    heroTag: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(13, 25, 48, 0.65)',
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      marginBottom: 18,
    },
    heroTagText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12, color: authColors.textPrimary },
    heroTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 34, color: '#FFFFFF' },
    heroTitleNarrow: { fontSize: 24 },
    heroSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    heroQuote: { fontFamily: fontFamilies.script, fontSize: 28, color: authColors.accentCyan, marginTop: 14 },
    heroQuoteAttribution: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 5 },
    // The former standalone "Frase do dia" section, now living inside the
    // hero card in the spot the old static proverb used to occupy — a
    // labeled chip (not just bare text) so it reads as its own modern,
    // interactive little widget, still sized to fit comfortably inside the
    // hero without pushing its height up much.
    heroPhraseBlock: {
      marginTop: 18,
      backgroundColor: 'rgba(13, 25, 48, 0.45)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 18,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    heroPhraseLabel: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
      letterSpacing: 0.3,
    },
    heroPhraseAudioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 12,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(56, 189, 248, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.4)',
      borderRadius: 999,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    heroPhraseAudioText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.accentCyan },
    // No marginTop here on purpose — a margin on this element (or on the
    // Pressable wrapping it) would still count as part of that element's
    // own box for layout, and box-shadow paints around the FULL box,
    // margin included, not just the visible pill. That was the leftover
    // "band" above the button: an empty-but-still-shadow-casting strip as
    // tall as the margin. The spacing instead lives on `heroButtonWrap`,
    // a plain View one level up with no shadow of its own to leak.
    heroButtonWrap: { marginTop: 24, alignSelf: 'flex-start' },
    // `borderRadius: 16` here must match the `borderRadius: 16` applied
    // inline to the Pressable wrapping this in DashboardScreen. The hover
    // glow's box-shadow is cast by that Pressable, not by this pill — if
    // the Pressable stays square-cornered while this pill is rounded, the
    // shadow's blur doesn't follow the pill's curve and pokes out past it
    // at the corners as a small squarish residue.
    heroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      alignSelf: 'flex-start',
      borderRadius: 16,
      paddingVertical: 15,
      paddingHorizontal: 24,
      shadowColor: authColors.accentCyan,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 6,
    },
    heroButtonText: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: '#FFFFFF', letterSpacing: 0.3 },
    heroCorner: { position: 'absolute', bottom: 20, right: 24, alignItems: 'flex-end' },
    heroCornerText: { fontFamily: fontFamilies.script, fontSize: 20, color: '#FFFFFF' },

    progressCard: {
      flex: 1,
      minWidth: 260,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 24,
      padding: 24,
      justifyContent: 'space-between',
    },
    progressCardNarrow: { flex: 0 },
    // Sized up from the original after removing "Ver detalhes" and the
    // duplicated streak/XP/diamonds row (already shown in the top stat
    // pills) — `progressCard`'s existing justify-content: space-between
    // still does the work of pinning the quote to the bottom; these are
    // just bigger/more-spaced now that there's less competing for the room.
    progressTitle: { fontFamily: fontFamilies.displayBold, fontSize: 19, color: authColors.textPrimary },
    progressLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 22 },
    progressLevelBadge: {
      width: 60,
      height: 60,
      borderRadius: 18,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderWidth: 1,
      borderColor: authColors.accentCyan,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressLevelBadgeText: { fontFamily: fontFamilies.displayExtraBold, fontSize: 19, color: authColors.accentCyan },
    progressLevelLabel: { fontFamily: fontFamilies.displaySemiBold, fontSize: 15, color: authColors.textSecondary },
    progressBarTrack: {
      height: 14,
      borderRadius: 7,
      backgroundColor: authColors.inputBg,
      overflow: 'hidden',
      marginTop: 24,
    },
    progressBarFill: { height: '100%', borderRadius: 7, backgroundColor: authColors.accentCyan },
    progressBarLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary, marginTop: 12 },
    progressQuoteBox: {
      marginTop: 32,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: authColors.divider,
    },
    progressQuoteText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 15, color: authColors.textPrimary, fontStyle: 'italic', lineHeight: 22 },
    progressQuoteAttribution: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary, marginTop: 8 },

    // Sections
    section: { paddingHorizontal: 28, marginBottom: 28 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sectionTitle: { fontFamily: fontFamilies.displayBold, fontSize: 19, color: authColors.textPrimary },
    sectionLink: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.accentCyan },

    // The horizontal ScrollView wrapping this row clips on the Y axis (it
    // has to, to avoid scrolling vertically too) and sizes its own height
    // exactly to the tallest card with zero slack — so the hover lift
    // (translateY) and its shadow, which both extend a bit beyond the
    // card's own box, were getting clipped at the top/bottom edge with no
    // room to breathe. paddingVertical gives them that room without
    // touching the cards' own size/spacing.
    moduleCarousel: { gap: 14, paddingRight: 14, paddingVertical: 10 },
    moduleCard: {
      width: 184,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 20,
      padding: 18,
    },
    moduleCardActive: {
      borderColor: authColors.accentCyan,
      shadowColor: authColors.accentCyan,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 6,
    },
    moduleIconBadge: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: 'rgba(56, 189, 248, 0.14)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    moduleIconBadgeActive: { backgroundColor: authColors.accentCyan },
    moduleTitle: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary },
    moduleProgressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: authColors.inputBg,
      overflow: 'hidden',
      marginTop: 10,
    },
    moduleProgressFill: { height: '100%', borderRadius: 3, backgroundColor: authColors.accentCyan },
    moduleCount: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: authColors.textSecondary, marginTop: 8 },
    moduleButton: {
      marginTop: 14,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
    },
    moduleButtonActive: { backgroundColor: authColors.accentBlue },
    moduleButtonInactive: { backgroundColor: authColors.inputBg, borderWidth: 1, borderColor: authColors.inputBorder },
    moduleButtonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12 },
    moduleButtonTextActive: { color: '#FFFFFF' },
    moduleButtonTextInactive: { color: authColors.textSecondary },

    journeyScroll: { paddingVertical: 8, paddingRight: 20 },
    journeyRow: { flexDirection: 'row', alignItems: 'flex-start' },
    journeyNode: { alignItems: 'center', width: 88 },
    journeyCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: authColors.inputBg,
      borderWidth: 2,
      borderColor: authColors.inputBorder,
    },
    journeyCircleActive: {
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      borderColor: authColors.accentCyan,
      shadowColor: authColors.accentCyan,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 14,
      elevation: 6,
    },
    journeyCircleDone: {
      backgroundColor: authColors.accentBlue,
      borderColor: authColors.accentBlue,
    },
    journeyCircleText: { fontSize: 20 },
    journeyLabel: { fontFamily: fontFamilies.displayBold, fontSize: 12, color: authColors.textPrimary, marginTop: 8, textAlign: 'center' },
    journeyLabelLocked: { color: authColors.textMuted },
    journeySubLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 10, color: authColors.textSecondary, textAlign: 'center' },
    journeyConnector: { width: 32, height: 2, backgroundColor: authColors.divider, marginTop: 27 },
    journeyConnectorDone: { backgroundColor: authColors.accentBlue },

  });
}
