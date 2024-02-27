import Image from "next/image";
import Link from "next/link";
import nwdIcon from "../_assets/nwd_icon.svg";

const navigation = [
  { name: "Merkmanifest", href: "#manifest" },
  // { name: 'Initatiefnemers', href: '#' },
  // { name: 'Veelgestelde vragen', href: '#' },
  // { name: 'Perskit', href: '#' },
  { name: "Contact", href: "#contact" },
];

export default function Header() {
  return (
    <header className="bg-[#fdfaf8]">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8 lg:py-4"
        aria-label="Global"
      >
        {/* <MenuProvider> */}
        {/* Logo */}
        <div className="flex items-center">
          <Image src={nwdIcon} alt="Nationaal Watersportdiploma" className="mr-4 h-14 w-auto" />
          <p className="hidden uppercase leading-tight text-brand-orange sm:block">
            <span className="">Nationaal</span> <span className="font-bold">Watersportdiploma</span>
          </p>
        </div>
        {/* <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div> */}
        <div className="flex gap-x-8 md:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-brand-dark-blue"
            >
              {item.name}
            </Link>
          ))}
        </div>
        {/* </MenuProvider> */}
      </nav>
    </header>
  );
}
