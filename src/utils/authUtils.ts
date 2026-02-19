import { fetchAuthSession } from 'aws-amplify/auth';

export async function isAdmin(): Promise<boolean> {
  try {
    const { tokens } = await fetchAuthSession();
    const groups = tokens?.accessToken?.payload?.['cognito:groups'] as string[] | undefined;
    return groups?.includes('admin') ?? false;
  } catch {
    return false;
  }
}
