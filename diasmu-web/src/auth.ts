import NextAuth from "next-auth";
import type { Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

import { apiUrl, auditLog, jsonAuthHeaders } from "@/lib/security";

type MuhammadiyahProfile = Profile & {
  m_id?: string;
  SSO_ID?: string;
  nama_lengkap?: string;
  nbm?: string;
  email?: string | null;
  image?: string | null;
  picture?: string | null;
  foto?: string | null;
  NBM?: string;
  nomor_baku?: string;
  // Field Struktural Keanggotaan PRM, PCM, PDM, PWM
  prm?: string;
  ranting?: string;
  pcm?: string;
  cabang?: string;
  pdm?: string;
  daerah?: string;
  pwm?: string;
  wilayah?: string;
  [key: string]: any;
};

type AuthUser = User & {
  nbm?: string;
  prm?: string;
  pcm?: string;
  pdm?: string;
  pwm?: string;
};

function readMuhammadiyahProfile(profile?: Profile) {
  return profile as MuhammadiyahProfile | undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "muhammadiyah",
      name: "Muhammadiyah ID",
      type: "oauth",
      clientId: process.env.MUHAMMADIYAH_CLIENT_ID,
      clientSecret: process.env.MUHAMMADIYAH_CLIENT_SECRET,
      authorization: {
        url: "https://sso.muhammadiyah.id/oauth/authorize",
        params: { scope: "user-info" },
      },
      token: "https://sso.muhammadiyah.id/oauth/token",
      userinfo: "https://sso.muhammadiyah.id/api/user-info",
      checks: ["state"],
      profile(profile: MuhammadiyahProfile) {
        return {
          id: profile.m_id ?? profile.SSO_ID ?? profile.sub ?? profile.email ?? "unknown-user",
          name: profile.name ?? profile.nama_lengkap ?? null,
          email: profile.email ?? null,
          image: profile.image ?? profile.picture ?? profile.foto ?? null,
          nbm: profile.nbm ?? profile.NBM ?? profile.nomor_baku,
          prm: profile.prm ?? profile.ranting ?? "",
          pcm: profile.pcm ?? profile.cabang ?? "",
          pdm: profile.pdm ?? profile.daerah ?? "",
          pwm: profile.pwm ?? profile.wilayah ?? "",
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, profile }: { user: AuthUser; profile?: Profile }) {
      try {
        const muhammadiyahProfile = readMuhammadiyahProfile(profile);
        const nbm = user?.nbm || muhammadiyahProfile?.nbm || muhammadiyahProfile?.NBM || muhammadiyahProfile?.nomor_baku || "";
        const name = user?.name || muhammadiyahProfile?.name || muhammadiyahProfile?.nama_lengkap || "Unknown User";
        const email = user?.email || muhammadiyahProfile?.email || "";
        const sso_user_id = user?.id || muhammadiyahProfile?.m_id || muhammadiyahProfile?.SSO_ID || muhammadiyahProfile?.sub || email || "unknown";

        // Ekstraksi data struktural PRM, PCM, PDM, PWM
        const prm = user?.prm || muhammadiyahProfile?.prm || muhammadiyahProfile?.ranting || "";
        const pcm = user?.pcm || muhammadiyahProfile?.pcm || muhammadiyahProfile?.cabang || "";
        const pdm = user?.pdm || muhammadiyahProfile?.pdm || muhammadiyahProfile?.daerah || "";
        const pwm = user?.pwm || muhammadiyahProfile?.pwm || muhammadiyahProfile?.wilayah || "";

        // Kirim full payload ke D1 (disimpan ke sso_raw_data)
        await fetch(apiUrl("/api/sso-users"), {
          method: "POST",
          headers: jsonAuthHeaders(),
          body: JSON.stringify({
            sso_user_id,
            nbm,
            name,
            email,
            prm,
            pcm,
            pdm,
            pwm,
            sso_raw_data: profile ? JSON.stringify(profile) : undefined,
          }),
        });

        await auditLog("auth.sign_in", { actor: nbm || email, nbm, email });
      } catch (error) {
        console.error("Gagal mencatat log login ke SSO Users:", error);
      }
      return true;
    },
    async jwt({ token, user, profile }: { token: JWT; user?: AuthUser; profile?: Profile }) {
      const muhammadiyahProfile = readMuhammadiyahProfile(profile);
      if (user || profile) {
        token.nbm = user?.nbm || muhammadiyahProfile?.nbm || muhammadiyahProfile?.NBM || "";
        token.email = user?.email || muhammadiyahProfile?.email || "";
        token.picture = user?.image || muhammadiyahProfile?.image || muhammadiyahProfile?.picture || muhammadiyahProfile?.foto || "";
        (token as any).prm = user?.prm || muhammadiyahProfile?.prm || muhammadiyahProfile?.ranting || "";
        (token as any).pcm = user?.pcm || muhammadiyahProfile?.pcm || muhammadiyahProfile?.cabang || "";
        (token as any).pdm = user?.pdm || muhammadiyahProfile?.pdm || muhammadiyahProfile?.daerah || "";
        (token as any).pwm = user?.pwm || muhammadiyahProfile?.pwm || muhammadiyahProfile?.wilayah || "";
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.nbm = token.nbm;
        session.user.email = token.email;
        session.user.image = token.picture as string | undefined;
        (session.user as any).prm = (token as any).prm;
        (session.user as any).pcm = (token as any).pcm;
        (session.user as any).pdm = (token as any).pdm;
        (session.user as any).pwm = (token as any).pwm;
      }
      return session;
    },
  },
  trustHost: true,
});
