import { Picture } from "@components/images/picture";
import { ConfirmationModal } from "@components/modals/confirmation-modal";
import Navigation from "@components/navigation";
import { TrackCard } from "@components/playlist/playlist-track-card";
import { Tooltip } from "@components/popovers/tooltip";
import { useAccessSpotify } from "@hooks/useAccessSpotify";
import { api, RouterOutputs } from "@utils/api";
import Link from "next/link";
import type { NextPage } from "next/types";

const Playlists: NextPage = () => {
  const [hasSpotify, isProviderLoading] = useAccessSpotify();
  const { data: playlists, refetch } = api.playlist.get_all.useQuery();
  const { mutate: erase } = api.playlist.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const { mutate: disconnect } = api.playlist.disconnect.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deletePlaylist = (
    playlist: RouterOutputs["playlist"]["get_all"][number]
  ) => {
    erase({ id: playlist.id });
  };

  const disconnectPlaylist = (
    playlist: RouterOutputs["playlist"]["get_all"][number]
  ) => {
    disconnect({ id: playlist.id });
  };

  return (
    <div className="min-h-screen w-screen">
      <Navigation />
      <div className="flex flex-wrap gap-4 p-4 px-28">
        <div className="flex h-96 w-96 flex-col items-center justify-center gap-4 rounded border border-gray-800">
          {!isProviderLoading && (
            <>
              {hasSpotify ? (
                <Link
                  href="/dashboard/playlist/create"
                  className="w-80 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                >
                  Créer une playlist
                </Link>
              ) : (
                <Tooltip timeoutDuration={500}>
                  <button className="w-80 rounded-full bg-white/50 px-6 py-1 text-center text-lg font-semibold text-black no-underline">
                    Créer une playlist
                  </button>
                  <div className="absolute flex -translate-y-16 flex-col gap-2 rounded border border-gray-800 bg-black/10 p-2 backdrop-blur-sm">
                    <p>
                      La création de playlist est disponible uniquement au
                      utilisateur ayant lié leur compte Spotify
                      <span className="ml-2">
                        <Link
                          href="/settings/account"
                          className="w-max rounded-full bg-white px-2 py-1 text-center text-sm font-semibold text-black no-underline transition-transform hover:scale-105"
                        >
                          Ajouter mon compte
                        </Link>
                      </span>
                    </p>
                  </div>
                </Tooltip>
              )}
            </>
          )}
          <Link
            href="/dashboard/playlist/search"
            className="w-80 rounded-full bg-pink-200 px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Rechercher une playlist
          </Link>
        </div>
        {playlists?.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onDelete={deletePlaylist}
            onDisconnect={disconnectPlaylist}
          />
        ))}
      </div>
    </div>
  );
};

type PlaylistCardProps = {
  playlist: RouterOutputs["playlist"]["get_all"][number];
  onDelete: (playlist: RouterOutputs["playlist"]["get_all"][number]) => void;
  onDisconnect: (
    playlist: RouterOutputs["playlist"]["get_all"][number]
  ) => void;
};
const PlaylistCard = ({
  playlist,
  onDelete,
  onDisconnect,
}: PlaylistCardProps) => {
  return (
    <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
      <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        <div>
          <p className="text-2xl">{playlist.name}</p>
          <p>{playlist.description}</p>
          <p>{playlist._count.tracks} tracks</p>
        </div>
        <Picture identifier={playlist.picture}>
          <img className="h-24 w-24 rounded" src={playlist.picture!} />
        </Picture>
      </div>
      <div className="flex-1 p-2">
        {playlist.tracks.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
      <div className="sticky bottom-0 flex flex-row items-center justify-center gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        {playlist.public ? (
          <>
            <ConfirmationModal
              title={`Retirer la playlist`}
              message={`Êtes vous certain de vouloir retirer la playlist ${playlist.name} de vos playlist ?`}
              action="Retirer"
              onSuccess={() => {
                onDisconnect(playlist);
              }}
            >
              <button className="rounded-full bg-pink-200 px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                Retirer
              </button>
            </ConfirmationModal>
          </>
        ) : (
          <>
            <Link
              href={`/dashboard/playlist/edit/${playlist.id}`}
              className="flex-1 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Modifier
            </Link>

            <ConfirmationModal
              title={`Supprimer la playlist`}
              message={`Êtes vous certain de vouloir supprimer votre playlist ${playlist.name} ? Cette action est irreversible, votre playlist sera effacée.`}
              action="Supprimer"
              onSuccess={() => {
                onDelete(playlist);
              }}
            >
              <button className="rounded-full bg-pink-200 px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                Supprimer
              </button>
            </ConfirmationModal>
          </>
        )}
      </div>
    </div>
  );
};

export default Playlists;
