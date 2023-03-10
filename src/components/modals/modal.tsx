import { Dialog, Transition } from "@headlessui/react";
import { Children, Fragment, isValidElement, ReactNode, useState } from "react";
import type { Element } from "./types";

type ModalProps = {
  defaultOpen?: boolean;
  children: ReactNode;
  title?: string;
  className?: string;
};

export function Modal(props: ModalProps) {
  const { defaultOpen = false, title } = props;
  let [isOpen, setIsOpen] = useState(defaultOpen);

  const [button, content] = Children.toArray(props.children).reduce<
    [Element | null | undefined, Element[]]
  >(
    (prev, child) => {
      if (isValidElement(child)) {
        if (child.type === "button") {
          prev[0] = child;
        } else {
          prev[1].push(child);
        }
      }
      return prev;
    },
    [null, []]
  );
  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <div
        onClickCapture={(e) => {
          e.stopPropagation();
          openModal();
        }}
        className={props.className}
      >
        {button}
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center text-white">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="transform overflow-hidden rounded-2xl border border-gray-800 bg-black/80 p-6 text-left align-middle shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition-all">
                  <Dialog.Title
                    as="h3"
                    className="mb-2 text-lg font-medium leading-6"
                  >
                    {title}
                  </Dialog.Title>
                  {content}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
