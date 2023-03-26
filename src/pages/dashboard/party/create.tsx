import { InputFade } from "@components/elements/input-fade";
import { InputSelect } from "@components/elements/input-select";
import { Friend, FriendCard } from "@components/friend/friend-card";
import { ExclamationIcon } from "@components/icons/exclamation";
import { Picture } from "@components/images/picture";
import { Playlist, PlaylistCard } from "@components/playlist/playlist-card";
import { Tab } from "@headlessui/react";
import { useZormTrigger } from "@hooks/useZormTrigger";
import { api } from "@utils/api";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { useZorm, Value } from "react-zorm";
import { z } from "zod";

const createSchema = z.object({
  playlists: z.array(
    z.object({
      id: z.string(),
    })
  ),
  mode: z.coerce
    .number()
    .min(0)
    .max(1)
    .transform((val) => {
      return val === 0 ? "SELECTION" : "RANDOM";
    }),
  friends: z.array(
    z.object({
      id: z.string(),
    })
  ),
  round: z.coerce.number().min(10),
});

const PartyCreate: NextPage = () => {
  const router = useRouter();
  const { data: playlists } = api.playlist.get_all.useQuery();
  const { data: allfriends } = api.friend.get_all.useQuery();
  // const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [selectedsPlaylist, setSelectedsPlaylist] = useState<
    Map<string, Playlist>
  >(new Map());
  const selectedsPlaylistCount = [...selectedsPlaylist.values()]
    .map((p) => p._count.tracks)
    .reduce((total, cur) => total + cur, 0);

  const [friends, setFriends] = useState<Map<string, Friend>>(new Map());
  const handleFriends = (friend: Friend) => {
    if (friends.has(friend.id)) {
      friends.delete(friend.id);
    } else {
      friends.set(friend.id, friend);
    }

    setFriends(new Map(friends));
  };

  const [playlistField, setPlaylistField] = useState<string | undefined>();
  const [friendField, setFriendField] = useState<string | undefined>();

  const { mutate: create } = api.party.create.useMutation({
    onSuccess: (data) => {
      router.push(`/party/${data.id}`);
    },
  });

  const zo = useZorm("create", createSchema, {
    async onValidSubmit(e) {
      e.preventDefault();
      if (!friends.size || !playlists) return;
      let playlist: Playlist | undefined;
      if (e.data.mode === "RANDOM") {
        playlist = playlists[Math.floor(Math.random() * playlists.length)];
      }
      const max_round =
        e.data.mode === "RANDOM" && playlist
          ? playlist._count.tracks
          : selectedsPlaylistCount;
      create({
        max_round: Math.min(max_round, e.data.round),
        playlists_id: playlist
          ? [playlist.id]
          : e.data.playlists.map(({ id }) => id),
        inviteds: e.data.friends.map(({ id }) => id),
      });
    },
  });

  const evRound = useZormTrigger(zo, zo.fields.mode());

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2 p-4">
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <InputFade
            onChange={(e) =>
              setPlaylistField(e.target.value.toLocaleLowerCase())
            }
          >
            Mes playlists
          </InputFade>
        </div>
        <div className="flex-1 p-2">
          {playlists
            ?.filter((playlist) =>
              playlistField
                ? playlist.name.toLocaleLowerCase().includes(playlistField)
                : true
            )
            .map((playlist) => (
              <div key={playlist.id} className="cursor-pointer">
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onClick={(playlist) =>
                    setSelectedsPlaylist(
                      (p) => new Map(p.set(playlist.id, playlist))
                    )
                  }
                  canShow
                />
              </div>
            ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <InputFade
            onChange={(e) => setFriendField(e.target.value.toLocaleLowerCase())}
          >
            Mes amis
          </InputFade>
        </div>
        <div className="flex-1 p-2">
          {allfriends
            ?.filter((friend) =>
              friendField
                ? !!friend.name?.toLocaleLowerCase().includes(friendField)
                : true
            )
            .map((friend) => (
              <div
                key={friend.id}
                className="cursor-pointer"
                onClick={() => handleFriends(friend)}
              >
                <FriendCard key={friend.id} friend={friend} />
              </div>
            ))}
        </div>
      </div>
      <form
        ref={zo.ref}
        className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 "
      >
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <button
            type="submit"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Créer la partie
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-10">
          <div className="">
            <div className="scrollbar-hide relative flex flex-1 flex-col overflow-y-auto">
              <Tab.Group defaultIndex={0} onChange={evRound}>
                <Tab.List className="absolute top-0 flex w-full gap-2 bg-black/10 px-6 py-2 backdrop-blur-sm">
                  {({ selectedIndex }) => (
                    <div className="flex flex-1 justify-evenly gap-2 rounded-full ring-2 ring-white ring-opacity-5">
                      <input
                        name={zo.fields.mode()}
                        type="hidden"
                        value={selectedIndex}
                      />
                      <Tab
                        className={({ selected }) =>
                          `flex-1 rounded-full py-1 px-6 text-lg font-semibold text-white no-underline transition-all duration-300 focus:outline-none ${
                            selected && " bg-white text-black hover:scale-105"
                          }`
                        }
                      >
                        Sélection
                      </Tab>
                      <Tab
                        className={({ selected }) =>
                          `flex-1 rounded-full py-1 px-6 text-lg font-semibold text-white no-underline transition-all duration-300 focus:outline-none ${
                            selected && " bg-white text-black hover:scale-105"
                          }`
                        }
                      >
                        Aléatoire
                      </Tab>
                    </div>
                  )}
                </Tab.List>
                <Tab.Panels className="overflow-auto pt-12">
                  <Tab.Panel className="flex h-44 w-full flex-col justify-start px-4 pt-2">
                    {[...selectedsPlaylist.values()].map((playlist, index) => (
                      <div key={playlist.id} className="cursor-pointer">
                        <input
                          type="hidden"
                          name={zo.fields.playlists(index).id()}
                          value={playlist.id}
                        />
                        <PlaylistCard
                          playlist={playlist}
                          canShow
                          onClick={(playlist) => {
                            selectedsPlaylist.delete(playlist.id);
                            setSelectedsPlaylist(new Map(selectedsPlaylist));
                          }}
                        />
                      </div>
                    ))}
                  </Tab.Panel>
                  <Tab.Panel className="flex h-full w-full flex-col justify-start px-4"></Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
          <div className="p-4">
            <div className="flex min-h-[5rem] flex-col gap-2">
              <label className="font-semibold">Amis</label>
              <div className="flex flex-wrap gap-2">
                {[...friends].map(([_, friend], index) => (
                  <Fragment key={friend.id}>
                    <input
                      name={zo.fields.friends(index).id()}
                      type="hidden"
                      value={friend.friendId}
                    />
                    <Picture identifier={friend.image}>
                      <img
                        alt={`playlist picture of ${friend.name}`}
                        src={friend.image!}
                        className="h-12 w-12 rounded border-gray-800 object-cover"
                      />
                    </Picture>
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex-1">
                <label htmlFor={zo.fields.round()} className="font-semibold">
                  Nombre de round
                </label>

                <InputSelect
                  id={zo.fields.round()}
                  name={zo.fields.round()}
                  type="number"
                  min="1"
                  max="100"
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                >
                  {Array(10)
                    .fill(null)
                    .map((_, idx) => (
                      <option key={idx} value={(idx + 1) * 10}>
                        {(idx + 1) * 10}
                      </option>
                    ))}
                </InputSelect>
              </div>
              <Value zorm={zo} name={zo.fields.mode()} event="change">
                {(random) => (
                  <>
                    {Boolean(
                      selectedsPlaylist.size &&
                        selectedsPlaylistCount < 20 &&
                        !Number(random)
                    ) && (
                      <div>
                        <div className="float-left px-2">
                          <ExclamationIcon className="mt-4 h-6 w-6" />
                        </div>
                        <p>
                          Les playlists sélectionnées contiennent moins de
                          tracks que de round. Le nombre de round sera de{" "}
                          {selectedsPlaylistCount}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Value>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default PartyCreate;
