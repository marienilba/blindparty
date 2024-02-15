import { Divider } from "@components/elements/divider";
import { ImageUpload, ImageUploadRef } from "@components/elements/image-upload";
import { PlusIcon } from "@components/icons/plus";
import { SignIn } from "@components/icons/sign-in";
import { SocialIcon, ensureProvider } from "@components/icons/socials";
import { AuthGuardUser } from "@components/layout/auth";
import { Modal } from "@components/modals/modal";
import { useSubmit } from "@hooks/zorm/useSubmit";
import { Noop } from "helpers/noop";
import { useQuery } from "@tanstack/react-query";
import { RouterOutputs, api } from "@utils/api";
import { getNextAuthProviders } from "@utils/next-auth";
import type { NextPageWithAuth, NextPageWithTitle } from "next";
import { signIn } from "next-auth/react";
import { ReactNode, useRef } from "react";
import { useZorm } from "react-zorm";
import { z } from "zod";

const editSchema = z.object({
  name: z.string().min(1),
});

const Settings: NextPageWithAuth & NextPageWithTitle = () => {
  const { data: accounts } = api.user.accounts.useQuery();
  const { data: allProviders } = useQuery(["next-auth-providers"], () =>
    getNextAuthProviders()
  );
  const { data: user, isLoading, refetch } = api.user.me.useQuery();

  const { mutateAsync: edit, isLoading: isUserLoading } =
    api.user.edit.useMutation({
      onSuccess: () => {
        refetch();

        // Hack for reload the next-auth session
        const event = new Event("visibilitychange");
        document.dispatchEvent(event);
      },
    });

  const imageUpload = useRef<ImageUploadRef | null>(null);
  const { submitPreventDefault, isSubmitting } = useSubmit<typeof editSchema>(
    async (e) => {
      if (!user) throw new Error("Should have user");

      let s3key = user?.s3key ?? getS3key(user.image);
      if (imageUpload.current && imageUpload.current.local) {
        await imageUpload.current.upload(s3key);
      }

      await edit({
        name: e.data.name,
        s3key: imageUpload.current ? imageUpload.current.key : undefined,
      });
    }
  );

  const zo = useZorm("edit", editSchema, {
    onValidSubmit: submitPreventDefault,
  });

  if (!user || isUserLoading) return <Noop />;

  return (
    <div className="flex flex-wrap gap-4 p-4 px-28">
      <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 backdrop-blur-sm">
          <Modal
            className="w-full"
            title="Liste des providers"
            options={{ titleCenter: true }}
          >
            <button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
              Lié un compte
            </button>
            <div className="scrollbar-hide relative flex h-96 w-96 flex-col gap-2 overflow-y-auto">
              <div className="flex-1 p-2">
                {allProviders && accounts?.providers && (
                  <div className="flex flex-col gap-2">
                    {allProviders
                      .filter(
                        (provider) =>
                          !accounts.providers.includes(
                            ensureProvider(provider.name.toLocaleLowerCase())
                          )
                      )
                      .map((provider) => (
                        <ProviderCard
                          key={provider.id}
                          provider={ensureProvider(
                            provider.name.toLocaleLowerCase()
                          )}
                        >
                          <PlusIcon
                            onClick={() => {
                              signIn(provider.id, {
                                // callbackUrl: "http://localhost:3000/dashboard",
                              });
                            }}
                            className="h-6 w-6 cursor-pointer group-hover:scale-125"
                          />
                        </ProviderCard>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {accounts?.platform && <ProviderCard provider={accounts.platform} />}
          <Divider />
          {accounts?.providers
            .filter((provider) => provider !== accounts.platform)
            .map((provider, idx) => (
              <ProviderCard key={idx} provider={provider}>
                <SignIn
                  onClick={() => {
                    signIn(provider, {
                      // callbackUrl: "http://localhost:3000/dashboard",
                    });
                  }}
                  className="h-6 w-6 cursor-pointer group-hover:scale-125"
                />
              </ProviderCard>
            ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <button
            disabled={isSubmitting || isLoading}
            type="submit"
            form="edit-user"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105 disabled:opacity-75"
          >
            Sauvegarder
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          <div className="flex justify-center gap-4">
            <ImageUpload
              src={user.image}
              ref={imageUpload}
              className="flex-1"
              prefix="user"
              presignedOptions={{ autoResigne: true, expires: 60 * 5 }}
            />
            <form
              ref={zo.ref}
              id="edit-user"
              className="flex h-full flex-[2] flex-col gap-2"
            >
              <div>
                <label htmlFor={zo.fields.name()} className="font-semibold">
                  Nom
                </label>
                <input
                  defaultValue={user.name ?? ""}
                  name={zo.fields.name()}
                  id={zo.fields.name()}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

type Provider = RouterOutputs["user"]["accounts"]["providers"][number];
type ProviderCardProps = {
  provider: Provider;
  children?: ReactNode;
};
const ProviderCard = ({ provider, children }: ProviderCardProps) => {
  return (
    <div className="group flex items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <SocialIcon provider={provider} />
      <div className="grow">
        <span className="block overflow-hidden truncate text-ellipsis font-bold capitalize tracking-tighter">
          {provider}
        </span>
      </div>
      {children}
    </div>
  );
};

export default Settings;
Settings.auth = AuthGuardUser;
Settings.title = "Account";

const getS3key = (url: string | null | undefined) => {
  if (!url) return undefined;

  const _url = new URL(url);
  if (
    _url.hostname ===
    `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_APP_AWS_REGION}.amazonaws.com`
  )
    return _url.pathname.substring(1);
  else return undefined;
};
