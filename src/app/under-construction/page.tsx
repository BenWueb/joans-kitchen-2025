import { MdConstruction } from "react-icons/md";

export default function UnderConstruction() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-8">
          <MdConstruction className="w-24 h-24 text-white animate-bounce" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Under Construction
        </h1>

        <p className="text-xl md:text-2xl text-white mb-8">
          We&apos;re cooking up something special!
        </p>
      </div>
    </div>
  );
}
