import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { jwtVerify } from 'jose';

const f = createUploadthing();

const JWT_SECRET = new TextEncoder().encode(
  process.env.UPLOADTHING_SECRET ?? 'fallback-dev-only',
);

/**
 * Upload de photo de profil.
 * Authentifié : seuls les utilisateurs connectés peuvent uploader.
 * Types acceptés : PNG, JPEG, WebP, AVIF — max 2 MB.
 *
 * L'authentification se fait via le header Authorization passé par le client
 * (configuré dans UploadButton.headers). Le middleware décode le JWT NestJS
 * pour récupérer le userId.
 */
export const ourFileRouter = {
  avatar: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Non authentifié');
      }
      const token = authHeader.slice(7);

      try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
          algorithms: ['HS256'],
        });
        const userId = payload.sub as string;
        if (!userId) throw new Error('Token invalide');
        return { userId };
      } catch {
        throw new Error('Token invalide ou expiré');
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload terminé pour', metadata.userId, ':', file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
