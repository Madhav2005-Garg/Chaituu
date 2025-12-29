import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', password: '', email: '' });
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/register/`, formData);
            alert("Account created! Welcome aboard.");
            window.location.reload();
        } catch (err) {
            alert("Error: Username might be taken.");
        } finally {
            setLoading(false);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: 'easeOut',
                staggerChildren: 0.12
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' }
        }
    };

    const inputFocusStyle = {
        boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.7)',
        borderColor: '#818cf8',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.7))',
        transition: 'all 0.18s ease-out'
    };

    return (
        <div style={styles.pageWrapper}>
            {/* Background layers */}
            <div style={styles.gridOverlay} />
            <div style={styles.meshGradient1}></div>
            <div style={styles.meshGradient2}></div>
            <div style={styles.noiseOverlay} />

            {/* Floating accent orbs */}
            <motion.div
                style={styles.floatingOrbPrimary}
                animate={{ y: [0, -18, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={styles.floatingOrbSecondary}
                animate={{ y: [0, 14, 0], scale: [1, 1.03, 1] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Accent top bar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={styles.accentHeader}
            >
                <div style={styles.accentLogoDot} />
                <span style={styles.accentHeaderText}>Nebula Chat • Real-time Collab</span>
            </motion.div>

            {/* Main card */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                style={styles.glassCard}
                whileHover={{
                    translateY: -4,
                    boxShadow: '0 30px 80px rgba(15,23,42,0.85)'
                }}
            >
                {/* Gradient border ring */}
                <div style={styles.gradientRing} />

                {/* Brand Icon + pill */}
                <motion.div variants={itemVariants} style={styles.iconWrapper}>
                    <div style={styles.iconBox}>
                        <span style={{ fontSize: '24px' }}>✨</span>
                    </div>
                    <div style={styles.statusPill}>
                        <span style={styles.statusDot} />
                        <span style={styles.statusText}>Live presence enabled</span>
                    </div>
                </motion.div>

                <motion.h1 variants={itemVariants} style={styles.title}>
                    Create your space
                </motion.h1>

                <motion.p variants={itemVariants} style={styles.subtitle}>
                    Spin up a personal profile and jump into real-time conversations in seconds.
                </motion.p>

                {/* Progress indicator */}
                <motion.div variants={itemVariants} style={styles.progressTrack}>
                    <motion.div
                        style={styles.progressThumb}
                        initial={{ width: '0%' }}
                        animate={{ width: '65%' }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    />
                </motion.div>

                <form onSubmit={handleRegister} style={styles.form}>
                    {/* Username */}
                    <motion.div variants={itemVariants} style={styles.fieldGroup}>
                        <label style={styles.label}>Username</label>
                        <motion.div whileFocus={{}} style={styles.inputWrapper}>
                            <span style={styles.inputPrefix}>@</span>
                            <input
                                type="text"
                                placeholder="choose-a-handle"
                                required
                                style={styles.input}
                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                onBlur={e => Object.assign(e.target.style, styles.input)}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </motion.div>
                        <p style={styles.hintText}>This will be visible to other members.</p>
                    </motion.div>

                    {/* Email */}
                    <motion.div variants={itemVariants} style={styles.fieldGroup}>
                        <label style={styles.label}>Email address</label>
                        <div style={styles.inputWrapper}>
                            <span style={styles.inputPrefix}>📧</span>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                required
                                style={styles.input}
                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                onBlur={e => Object.assign(e.target.style, styles.input)}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <p style={styles.hintText}>Used for account security and recovery.</p>
                    </motion.div>

                    {/* Password */}
                    <motion.div variants={itemVariants} style={styles.fieldGroup}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.inputWrapper}>
                            <span style={styles.inputPrefix}>🔒</span>
                            <input
                                type="password"
                                placeholder="Create a strong password"
                                required
                                style={styles.input}
                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                onBlur={e => Object.assign(e.target.style, styles.input)}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <ul style={styles.passwordMeta}>
                            <li>At least 8 characters</li>
                            <li>Mix of letters and numbers</li>
                        </ul>
                    </motion.div>

                    {/* CTA + meta */}
                    <motion.div variants={itemVariants} style={styles.actionsRow}>
                        <motion.button
                            whileHover={{
                                scale: 1.03,
                                background: 'linear-gradient(135deg,#4f46e5,#a855f7,#22c55e)',
                                boxShadow: '0 18px 35px rgba(79,70,229,0.65)'
                            }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            style={styles.submitBtn}
                            disabled={loading}
                        >
                            <span>{loading ? 'Creating your universe…' : 'Get Started — Free'}</span>
                            {!loading && (
                                <motion.span
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 }}
                                    style={styles.submitArrow}
                                >
                                    →
                                </motion.span>
                            )}
                        </motion.button>

                        <div style={styles.secondaryMeta}>
                            <span style={styles.metaBadge}>No card required</span>
                            <span style={styles.metaSeparator}>•</span>
                            <span style={styles.metaText}>Setup under 60 seconds</span>
                        </div>
                    </motion.div>
                </form>

                {/* Footer */}
                <motion.div variants={itemVariants} style={styles.footerRow}>
                    <p style={styles.footerText}>
                        Already a member?{' '}
                        <span style={styles.link} onClick={() => window.location.reload()}>
                            Sign in instantly
                        </span>
                    </p>
                    <p style={styles.legalText}>
                        By continuing, you agree to our Terms and Privacy Policy.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

// styles
const styles = {
    pageWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 0% 0%, #0f172a 0, #020617 45%, #020617 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#e5e7eb',
        padding: '16px',
        boxSizing: 'border-box'
    },
    gridOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.35,
        pointerEvents: 'none'
    },
    meshGradient1: {
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '520px',
        height: '520px',
        background: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, transparent 70%)',
        filter: 'blur(70px)',
        zIndex: 0
    },
    meshGradient2: {
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '620px',
        height: '620px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
    },
    noiseOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 160 160\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\' x=\'0%25\' y=\'0%25\' width=\'100%25\' height=\'100%25\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2.2\' numOctaves=\'2\' stitchTiles=\'noStitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.18\'/%3E%3C/svg%3E")',
        mixBlendMode: 'soft-light',
        opacity: 0.45,
        pointerEvents: 'none'
    },
    floatingOrbPrimary: {
        position: 'absolute',
        top: '12%',
        left: '12%',
        width: '140px',
        height: '140px',
        borderRadius: '999px',
        background: 'radial-gradient(circle at 30% 20%, rgba(251,113,133,0.9), rgba(30,64,175,0.1))',
        filter: 'blur(1px)',
        opacity: 0.9
    },
    floatingOrbSecondary: {
        position: 'absolute',
        bottom: '8%',
        right: '10%',
        width: '170px',
        height: '170px',
        borderRadius: '999px',
        background: 'radial-gradient(circle at 70% 30%, rgba(96,165,250,0.9), rgba(30,64,175,0.1))',
        filter: 'blur(1px)',
        opacity: 0.85
    },
    accentHeader: {
        position: 'absolute',
        top: '18px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '999px',
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(148,163,184,0.35)',
        backdropFilter: 'blur(16px)',
        fontSize: '12px',
        color: '#e5e7eb',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        zIndex: 2
    },
    accentLogoDot: {
        width: '8px',
        height: '8px',
        borderRadius: '999px',
        background: 'conic-gradient(from 0deg, #22c55e, #2dd4bf, #4f46e5, #22c55e)'
    },
    accentHeaderText: {
        opacity: 0.9
    },
    glassCard: {
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.88))',
        borderRadius: '32px',
        padding: '40px 34px 30px',
        width: '100%',
        maxWidth: '440px',
        textAlign: 'left',
        boxShadow: '0 22px 60px rgba(15,23,42,0.95)',
        border: '1px solid rgba(148,163,184,0.35)',
        backdropFilter: 'blur(26px)',
        zIndex: 1,
        overflow: 'hidden'
    },
    gradientRing: {
        position: 'absolute',
        inset: '-1px',
        borderRadius: 'inherit',
        padding: '1.5px',
        background: 'conic-gradient(from 140deg, rgba(96,165,250,0.5), rgba(244,114,182,0.8), rgba(55,65,81,0.6), rgba(96,165,250,0.5))',
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        opacity: 0.75,
        pointerEvents: 'none'
    },
    iconWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
    },
    iconBox: {
        width: '56px',
        height: '56px',
        background: 'radial-gradient(circle at 30% 0%, #fbbf24, #6d28d9, #0f172a)',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 18px 45px rgba(88,28,135,0.8), 0 0 0 1px rgba(148,163,184,0.38)',
        border: '1px solid rgba(248,250,252,0.16)'
    },
    statusPill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '999px',
        background: 'rgba(15,23,42,0.9)',
        border: '1px solid rgba(52,211,153,0.45)',
        fontSize: '11px',
        color: '#a5b4fc'
    },
    statusDot: {
        width: '6px',
        height: '6px',
        borderRadius: '999px',
        background: '#22c55e',
        boxShadow: '0 0 0 6px rgba(34,197,94,0.35)'
    },
    statusText: {
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
    },
    title: {
        fontSize: '28px',
        fontWeight: 800,
        color: '#f9fafb',
        marginBottom: '6px',
        letterSpacing: '-0.04em'
    },
    subtitle: {
        color: '#9ca3af',
        fontSize: '14px',
        marginBottom: '18px',
        lineHeight: 1.6
    },
    progressTrack: {
        width: '100%',
        height: '5px',
        borderRadius: '999px',
        background: 'rgba(31,41,55,0.9)',
        overflow: 'hidden',
        marginBottom: '24px'
    },
    progressThumb: {
        height: '100%',
        borderRadius: 'inherit',
        background: 'linear-gradient(90deg,#4f46e5,#a855f7,#22c55e,#22c55e)'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#e5e7eb',
        letterSpacing: '0.04em',
        textTransform: 'uppercase'
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    inputPrefix: {
        position: 'absolute',
        left: '15px',
        fontSize: '14px',
        color: '#6b7280',
        pointerEvents: 'none'
    },
    input: {
        width: '100%',
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(55,65,81,0.95)',
        borderRadius: '14px',
        padding: '14px 16px 14px 38px',
        color: '#f9fafb',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.18s ease-out',
        boxSizing: 'border-box',
        boxShadow: '0 0 0 0 rgba(129,140,248,0)',
        caretColor: '#a855f7'
    },
    hintText: {
        fontSize: '12px',
        color: '#6b7280'
    },
    passwordMeta: {
        listStyle: 'disc',
        paddingLeft: '18px',
        margin: '4px 0 0',
        fontSize: '11px',
        color: '#6b7280',
        display: 'grid',
        rowGap: '2px'
    },
    actionsRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '8px'
    },
    submitBtn: {
        background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)',
        color: '#fff',
        border: 'none',
        padding: '14px 16px',
        borderRadius: '16px',
        fontWeight: 700,
        fontSize: '15px',
        cursor: 'pointer',
        marginTop: '4px',
        boxShadow: '0 12px 32px rgba(79,70,229,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        letterSpacing: '0.02em'
    },
    submitArrow: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    secondaryMeta: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: '#9ca3af'
    },
    metaBadge: {
        padding: '4px 8px',
        borderRadius: '999px',
        background: 'rgba(22,163,74,0.12)',
        color: '#bbf7d0',
        border: '1px solid rgba(34,197,94,0.35)'
    },
    metaSeparator: {
        opacity: 0.5
    },
    metaText: {
        opacity: 0.9
    },
    footerRow: {
        marginTop: '22px',
        borderTop: '1px solid rgba(31,41,55,0.9)',
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    footerText: {
        color: '#9ca3af',
        fontSize: '13px'
    },
    legalText: {
        color: '#4b5563',
        fontSize: '11px'
    },
    link: {
        color: '#818cf8',
        cursor: 'pointer',
        fontWeight: 600,
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '3px'
    }
};

export default Register;