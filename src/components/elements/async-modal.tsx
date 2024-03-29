import { Dialog, Transition } from "@headlessui/react";
import { noop } from "helpers/noop";
import {
  Children,
  Fragment,
  ReactNode,
  forwardRef,
  isValidElement,
  useContext,
  useImperativeHandle,
  useState,
} from "react";
import { Context, Modal } from "./modal";

export const AsyncModal = () => {};

type AsyncModalProps = {
  children: ReactNode;
  beforeOpen: (...args: any) => Promise<any>;
  closeOnOutside?: boolean;
};

export type ModalRef = {
  open: () => void;
  close: () => void;
};

AsyncModal.Root = forwardRef<ModalRef, AsyncModalProps>((props, forwardRef) => {
  const { closeOnOutside = true } = props;
  let [isOpen, setIsOpen] = useState(false);

  const button = Children.map(props.children, (child) =>
    isValidElement(child) && child.type === AsyncModal.Trigger ? child : false
  );

  const content = Children.map(props.children, (child) =>
    isValidElement(child) && child.type === AsyncModal.Content ? child : false
  );

  const title = Children.map(props.children, (child) =>
    isValidElement(child) && child.type === AsyncModal.Title ? child : false
  );

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    props.beforeOpen().then(() => setIsOpen(true));
  }

  useImperativeHandle(
    forwardRef,
    () => ({
      open: openModal,
      close: closeModal,
    }),
    []
  );

  return (
    <Context.Provider value={{ open: openModal, close: closeModal }}>
      {button}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={closeOnOutside ? closeModal : noop}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center text-white">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="transform overflow-hidden rounded-2xl border border-gray-800 bg-white/5 p-6 text-left align-middle shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition-all">
                  {title}
                  {content}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Context.Provider>
  );
});

AsyncModal.Trigger = Modal.Trigger;

AsyncModal.Close = Modal.Close;

AsyncModal.Content = Modal.Content;

AsyncModal.Title = Modal.Title;

export function useModal() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error(`useModal must be used within a Modal.Root.`);
  }
  return context;
}
